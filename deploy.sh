#!/bin/bash
# =============================================================================
# AWS Study Hub - Universal Deployment Script
# =============================================================================
# Deploys Study Hub Homepage, Cloud Practitioner Game, and AI Study Game
# Run from: ~/dev/sites/aws-study-flashcards.com/
# Usage: ./deploy.sh [all|hub|cloud|ai]
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Site configurations
declare -A SITES
SITES=(
    ["hub,name"]="Study Hub Homepage"
    ["hub,folder"]="aws-study-homepage"
    ["hub,bucket"]="aws-study-flashcards-app-home"
    ["hub,dist_id"]="E3D126UT3L72OL"
    
    ["cloud,name"]="Cloud Practitioner Game"
    ["cloud,folder"]="aws-cloud-practitioner-game"
    ["cloud,bucket"]="cloud.aws-study-flashcards-app.com"
    ["cloud,dist_id"]="E6NUXKK8FTCR1"
    
    ["ai,name"]="AI Study Game"
    ["ai,folder"]="aws-ai-study-game"
    ["ai,bucket"]="ai.aws-study-flashcards-app.com"
    ["ai,dist_id"]="E23TPCWLVKFC65"
)

# Get the script's directory (root of project)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"

# Track deployment results
declare -A RESULTS

# =============================================================================
# Helper Functions
# =============================================================================

print_header() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_step() {
    echo -e "${YELLOW}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

# =============================================================================
# Deployment Function
# =============================================================================

deploy_site() {
    local site_key=$1
    local site_name="${SITES[${site_key},name]}"
    local folder="${SITES[${site_key},folder]}"
    local bucket="${SITES[${site_key},bucket]}"
    local dist_id="${SITES[${site_key},dist_id]}"
    local site_path="${SCRIPT_DIR}/${folder}"
    
    print_header "Deploying: ${site_name}"
    
    # Check if directory exists
    if [ ! -d "$site_path" ]; then
        print_error "Directory not found: $site_path"
        RESULTS[$site_key]="FAILED - Directory not found"
        return 1
    fi
    
    cd "$site_path"
    print_info "Working in: $site_path"
    
    # Step 1: Install dependencies (if node_modules doesn't exist or package.json changed)
    print_step "Checking dependencies..."
    if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
        print_step "Installing dependencies..."
        npm install
        print_success "Dependencies installed"
    else
        print_success "Dependencies up to date"
    fi
    
    # Step 2: Build
    print_step "Building ${site_name}..."
    npm run build
    
    if [ ! -d "dist" ]; then
        print_error "Build failed - dist folder not found"
        RESULTS[$site_key]="FAILED - Build error"
        return 1
    fi
    print_success "Build complete"
    
    # Step 3: Sync to S3
    print_step "Uploading to S3: s3://${bucket}/"
    
    # Sync all files except index.html (with cache)
    aws s3 sync dist/ "s3://${bucket}/" \
        --delete \
        --exclude "index.html" \
        --cache-control "max-age=31536000,public"
    
    # Upload index.html with no-cache
    aws s3 cp dist/index.html "s3://${bucket}/index.html" \
        --cache-control "no-cache,no-store,must-revalidate"
    
    print_success "Files uploaded to S3"
    
    # Step 4: Invalidate CloudFront
    print_step "Invalidating CloudFront cache (${dist_id})..."
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "$dist_id" \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)
    
    print_success "CloudFront invalidation created: ${INVALIDATION_ID}"
    
    # Return to script directory
    cd "$SCRIPT_DIR"
    
    RESULTS[$site_key]="SUCCESS"
    print_success "${site_name} deployed successfully!"
    
    return 0
}

# =============================================================================
# Menu Functions
# =============================================================================

show_menu() {
    print_header "AWS Study Hub Deployment"
    echo "  Select what to deploy:"
    echo ""
    echo "  ${BOLD}1)${NC} Deploy ALL sites"
    echo "  ${BOLD}2)${NC} Study Hub Homepage    (aws-study-flashcards-app.com)"
    echo "  ${BOLD}3)${NC} Cloud Practitioner    (cloud.aws-study-flashcards-app.com)"
    echo "  ${BOLD}4)${NC} AI Study Game         (ai.aws-study-flashcards-app.com)"
    echo "  ${BOLD}5)${NC} Exit"
    echo ""
    read -p "Enter choice [1-5]: " choice
    
    case $choice in
        1) deploy_all ;;
        2) deploy_site "hub" ;;
        3) deploy_site "cloud" ;;
        4) deploy_site "ai" ;;
        5) echo "Goodbye!"; exit 0 ;;
        *) print_error "Invalid choice"; show_menu ;;
    esac
}

deploy_all() {
    print_header "Deploying ALL Sites"
    
    local start_time=$(date +%s)
    local failed=0
    
    for site_key in hub cloud ai; do
        deploy_site "$site_key" || ((failed++))
        echo ""
    done
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Summary
    print_header "Deployment Summary"
    echo ""
    for site_key in hub cloud ai; do
        local site_name="${SITES[${site_key},name]}"
        local result="${RESULTS[$site_key]}"
        if [[ "$result" == "SUCCESS" ]]; then
            echo -e "  ${GREEN}✓${NC} ${site_name}: ${GREEN}${result}${NC}"
        else
            echo -e "  ${RED}✗${NC} ${site_name}: ${RED}${result}${NC}"
        fi
    done
    echo ""
    echo -e "  ${CYAN}Total time: ${duration} seconds${NC}"
    echo ""
    
    if [ $failed -gt 0 ]; then
        print_error "$failed deployment(s) failed"
        return 1
    else
        print_success "All deployments completed successfully!"
        echo ""
        echo "  🌐 Hub:   https://aws-study-flashcards-app.com"
        echo "  ☁️  Cloud: https://cloud.aws-study-flashcards-app.com"
        echo "  🤖 AI:    https://ai.aws-study-flashcards-app.com"
        echo ""
    fi
}

# =============================================================================
# Main Entry Point
# =============================================================================

# Check for AWS CLI
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI not found. Please install it first."
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured. Run 'aws configure' first."
    exit 1
fi

# Parse command line arguments
case "${1:-}" in
    all)
        deploy_all
        ;;
    hub)
        deploy_site "hub"
        ;;
    cloud)
        deploy_site "cloud"
        ;;
    ai)
        deploy_site "ai"
        ;;
    -h|--help)
        echo "Usage: $0 [all|hub|cloud|ai]"
        echo ""
        echo "Options:"
        echo "  all    Deploy all three sites"
        echo "  hub    Deploy Study Hub Homepage only"
        echo "  cloud  Deploy Cloud Practitioner Game only"
        echo "  ai     Deploy AI Study Game only"
        echo ""
        echo "Run without arguments for interactive menu."
        ;;
    "")
        show_menu
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Run '$0 --help' for usage information."
        exit 1
        ;;
esac
