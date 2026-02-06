#!/bin/zsh
# =============================================================================
# AWS Study Hub - Universal Deployment Script (ZSH Compatible)
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

# Get the script's directory (root of project)
SCRIPT_DIR="${0:A:h}"

# =============================================================================
# Helper Functions
# =============================================================================

print_header() {
    echo ""
    echo "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo "${CYAN}  $1${NC}"
    echo "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_step() {
    echo "${YELLOW}▶ $1${NC}"
}

print_success() {
    echo "${GREEN}✓ $1${NC}"
}

print_error() {
    echo "${RED}✗ $1${NC}"
}

print_info() {
    echo "${CYAN}ℹ $1${NC}"
}

# =============================================================================
# Deployment Function
# =============================================================================

deploy_hub() {
    local site_name="Study Hub Homepage"
    local folder="aws-study-homepage"
    local bucket="aws-study-flashcards-app-home"
    local dist_id="E3D126UT3L72OL"
    local site_path="${SCRIPT_DIR}/${folder}"
    
    print_header "Deploying: ${site_name}"
    
    if [ ! -d "$site_path" ]; then
        print_error "Directory not found: $site_path"
        return 1
    fi
    
    cd "$site_path"
    print_info "Working in: $site_path"
    
    # Install dependencies if needed
    print_step "Checking dependencies..."
    if [ ! -d "node_modules" ]; then
        print_step "Installing dependencies..."
        npm install
    fi
    print_success "Dependencies ready"
    
    # Build
    print_step "Building ${site_name}..."
    npm run build
    print_success "Build complete"
    
    # Sync to S3
    print_step "Uploading to S3: s3://${bucket}/"
    aws s3 sync dist/ "s3://${bucket}/" \
        --delete \
        --exclude "index.html" \
        --cache-control "max-age=31536000,public"
    
    aws s3 cp dist/index.html "s3://${bucket}/index.html" \
        --cache-control "no-cache,no-store,must-revalidate"
    print_success "Files uploaded to S3"
    
    # Invalidate CloudFront
    print_step "Invalidating CloudFront cache..."
    aws cloudfront create-invalidation \
        --distribution-id "$dist_id" \
        --paths "/*" > /dev/null
    print_success "CloudFront invalidation created"
    
    cd "$SCRIPT_DIR"
    print_success "${site_name} deployed!"
    echo "  🌐 https://aws-study-flashcards-app.com"
}

deploy_cloud() {
    local site_name="Cloud Practitioner Game"
    local folder="aws-cloud-practitioner-game"
    local bucket="cloud.aws-study-flashcards-app.com"
    local dist_id="E6NUXKK8FTCR1"
    local site_path="${SCRIPT_DIR}/${folder}"
    
    print_header "Deploying: ${site_name}"
    
    if [ ! -d "$site_path" ]; then
        print_error "Directory not found: $site_path"
        return 1
    fi
    
    cd "$site_path"
    print_info "Working in: $site_path"
    
    # Install dependencies if needed
    print_step "Checking dependencies..."
    if [ ! -d "node_modules" ]; then
        print_step "Installing dependencies..."
        npm install
    fi
    print_success "Dependencies ready"
    
    # Build
    print_step "Building ${site_name}..."
    npm run build
    print_success "Build complete"
    
    # Sync to S3
    print_step "Uploading to S3: s3://${bucket}/"
    aws s3 sync dist/ "s3://${bucket}/" \
        --delete \
        --exclude "index.html" \
        --cache-control "max-age=31536000,public"
    
    aws s3 cp dist/index.html "s3://${bucket}/index.html" \
        --cache-control "no-cache,no-store,must-revalidate"
    print_success "Files uploaded to S3"
    
    # Invalidate CloudFront
    print_step "Invalidating CloudFront cache..."
    aws cloudfront create-invalidation \
        --distribution-id "$dist_id" \
        --paths "/*" > /dev/null
    print_success "CloudFront invalidation created"
    
    cd "$SCRIPT_DIR"
    print_success "${site_name} deployed!"
    echo "  ☁️  https://cloud.aws-study-flashcards-app.com"
}

deploy_ai() {
    local site_name="AI Study Game"
    local folder="aws-ai-study-game"
    local bucket="ai.aws-study-flashcards-app.com"
    local dist_id="E23TPCWLVKFC65"
    local site_path="${SCRIPT_DIR}/${folder}"
    
    print_header "Deploying: ${site_name}"
    
    if [ ! -d "$site_path" ]; then
        print_error "Directory not found: $site_path"
        return 1
    fi
    
    cd "$site_path"
    print_info "Working in: $site_path"
    
    # Install dependencies if needed
    print_step "Checking dependencies..."
    if [ ! -d "node_modules" ]; then
        print_step "Installing dependencies..."
        npm install
    fi
    print_success "Dependencies ready"
    
    # Build
    print_step "Building ${site_name}..."
    npm run build
    print_success "Build complete"
    
    # Sync to S3
    print_step "Uploading to S3: s3://${bucket}/"
    aws s3 sync dist/ "s3://${bucket}/" \
        --delete \
        --exclude "index.html" \
        --cache-control "max-age=31536000,public"
    
    aws s3 cp dist/index.html "s3://${bucket}/index.html" \
        --cache-control "no-cache,no-store,must-revalidate"
    print_success "Files uploaded to S3"
    
    # Invalidate CloudFront
    print_step "Invalidating CloudFront cache..."
    aws cloudfront create-invalidation \
        --distribution-id "$dist_id" \
        --paths "/*" > /dev/null
    print_success "CloudFront invalidation created"
    
    cd "$SCRIPT_DIR"
    print_success "${site_name} deployed!"
    echo "  🤖 https://ai.aws-study-flashcards-app.com"
}

deploy_all() {
    print_header "Deploying ALL Sites"
    
    local start_time=$(date +%s)
    local failed=0
    
    deploy_hub || ((failed++))
    echo ""
    deploy_cloud || ((failed++))
    echo ""
    deploy_ai || ((failed++))
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    print_header "Deployment Complete!"
    echo ""
    if [ $failed -eq 0 ]; then
        print_success "All 3 sites deployed successfully in ${duration} seconds"
    else
        print_error "$failed deployment(s) failed"
    fi
    echo ""
    echo "  🌐 Hub:   https://aws-study-flashcards-app.com"
    echo "  ☁️  Cloud: https://cloud.aws-study-flashcards-app.com"
    echo "  🤖 AI:    https://ai.aws-study-flashcards-app.com"
    echo ""
    print_info "CloudFront invalidations may take 1-2 minutes to propagate"
    echo ""
}

# =============================================================================
# Main Entry Point
# =============================================================================

# Check for AWS CLI
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI not found. Please install it first."
    exit 1
fi

# Parse command line arguments
case "${1:-}" in
    all)
        deploy_all
        ;;
    hub)
        deploy_hub
        ;;
    cloud)
        deploy_cloud
        ;;
    ai)
        deploy_ai
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
        ;;
    "")
        echo ""
        echo "AWS Study Hub Deployment"
        echo "========================"
        echo ""
        echo "  1) all    - Deploy ALL sites"
        echo "  2) hub    - Study Hub Homepage"
        echo "  3) cloud  - Cloud Practitioner Game"
        echo "  4) ai     - AI Study Game"
        echo ""
        read "choice?Enter choice [all/hub/cloud/ai]: "
        
        case $choice in
            1|all) deploy_all ;;
            2|hub) deploy_hub ;;
            3|cloud) deploy_cloud ;;
            4|ai) deploy_ai ;;
            *) print_error "Invalid choice" ;;
        esac
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Run '$0 --help' for usage information."
        exit 1
        ;;
esac
