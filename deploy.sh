#!/bin/zsh
# =============================================================================
# AWS Study Hub - Universal Deployment Script (ZSH Compatible)
# =============================================================================
# Deploys the Study Hub Homepage, the certification study games, and Tutorials
# Run from: ~/dev/sites/aws-study-flashcards.com/
# Usage: ./deploy.sh [all|hub|cloud|ai|saa|dva|bash|python|tutorials]
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

    # Guard: an untracked .env is required — building without it ships with
    # billing switched off and no price labels
    if [ ! -f .env ]; then
        print_error ".env missing in $folder — aborting. Copy it from the main checkout before deploying."
        cd "$SCRIPT_DIR"
        return 1
    fi
    
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
        --exclude "next/*" \
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

    # Guard: an untracked .env is required — building without it ships with
    # billing switched off and no price labels
    if [ ! -f .env ]; then
        print_error ".env missing in $folder — aborting. Copy it from the main checkout before deploying."
        cd "$SCRIPT_DIR"
        return 1
    fi
    
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
        --exclude "next/*" \
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

    # Guard: an untracked .env is required — building without it ships with
    # billing switched off and no price labels
    if [ ! -f .env ]; then
        print_error ".env missing in $folder — aborting. Copy it from the main checkout before deploying."
        cd "$SCRIPT_DIR"
        return 1
    fi
    
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
        --exclude "next/*" \
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

deploy_saa() {
    local site_name="Solutions Architect Study Game"
    local folder="aws-saa-study-game"
    local bucket="saa.aws-study-flashcards-app.com"
    local dist_id="EBOXWN6EUZHKF"
    local site_path="${SCRIPT_DIR}/${folder}"

    print_header "Deploying: ${site_name}"

    if [ ! -d "$site_path" ]; then
        print_error "Directory not found: $site_path"
        return 1
    fi

    cd "$site_path"
    print_info "Working in: $site_path"

    # Guard: an untracked .env is required — building without it ships with
    # billing switched off and no price labels
    if [ ! -f .env ]; then
        print_error ".env missing in $folder — aborting. Copy it from the main checkout before deploying."
        cd "$SCRIPT_DIR"
        return 1
    fi

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
        --exclude "next/*" \
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
    echo "  🏗️  https://architect.aws-study-flashcards-app.com"
}

deploy_dva() {
    local site_name="Developer Associate Study Game"
    local folder="aws-dva-study-game"
    local bucket="dva.aws-study-flashcards-app.com"
    local dist_id="E2UB744W5YUCTW"
    local site_path="${SCRIPT_DIR}/${folder}"

    print_header "Deploying: ${site_name}"

    if [ ! -d "$site_path" ]; then
        print_error "Directory not found: $site_path"
        return 1
    fi

    cd "$site_path"
    print_info "Working in: $site_path"

    # Guard: an untracked .env is required — building without it ships with
    # billing switched off and no price labels
    if [ ! -f .env ]; then
        print_error ".env missing in $folder — aborting. Copy it from the main checkout before deploying."
        cd "$SCRIPT_DIR"
        return 1
    fi

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
        --exclude "next/*" \
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
    echo "  👨‍💻 https://developer.aws-study-flashcards-app.com"
}

# Coding course sites: one app (aws-coding-courses), built once per course
# with COURSE=<id> into dist/<id>/. Add python/js/typescript the same way.
deploy_course() {
    local course="$1"
    local bucket="$2"
    local dist_id="$3"
    local site_path="${SCRIPT_DIR}/aws-coding-courses"

    print_header "Deploying: ${course} course"
    cd "$site_path"

    print_step "Checking dependencies..."
    if [ ! -d "node_modules" ]; then
        npm install
    fi

    print_step "Testing the practice shell and every task's answer..."
    npm test
    print_success "Tests passed"

    print_step "Building ${course}..."
    COURSE="$course" npm run build
    print_success "Build complete"

    print_step "Uploading to S3: s3://${bucket}/"
    aws s3 sync "dist/${course}/" "s3://${bucket}/" \
        --delete \
        --exclude "index.html" \
        --cache-control "max-age=31536000,public"
    aws s3 cp "dist/${course}/index.html" "s3://${bucket}/index.html" \
        --cache-control "no-cache,no-store,must-revalidate"
    print_success "Files uploaded to S3"

    print_step "Invalidating CloudFront cache..."
    aws cloudfront create-invalidation --distribution-id "$dist_id" --paths "/*" > /dev/null
    print_success "CloudFront invalidation created"

    cd "$SCRIPT_DIR"
    print_success "${course} course deployed!"
    echo "  💲 https://${bucket}"
}

deploy_bash() {
    deploy_course bash "bash.aws-study-flashcards-app.com" "EYR8XH2CLI1DT"
}

deploy_python() {
    deploy_course python "python.aws-study-flashcards-app.com" "E205DY614C5Q4C"
}

deploy_tutorials() {
    local site_name="Tutorials (Cognito-gated, static)"
    local site_path="${HOME}/dev/aws/tutorials-site/site"
    local bucket="tutorials-aws-study-flashcards-app-418272768335"
    local dist_id="E24YKUY1M23PV0"
    local html=(--content-type "text/html; charset=utf-8" --cache-control "public, max-age=300")

    print_header "Deploying: ${site_name}"
    if [ ! -d "$site_path" ]; then
        print_error "Directory not found: $site_path"
        return 1
    fi

    print_step "Uploading pages to s3://${bucket}/"
    aws s3 cp "$site_path/index.html" "s3://${bucket}/index.html" "${html[@]}"
    for page in "$site_path"/*/index.html(N); do
        local slug="${page:h:t}"
        # Private S3 + OAC won't resolve /slug -> /slug/index.html, so upload both keys
        aws s3 cp "$page" "s3://${bucket}/${slug}/index.html" "${html[@]}"
        aws s3 cp "$page" "s3://${bucket}/${slug}" "${html[@]}"
        print_info "  /${slug}"
    done
    print_success "Files uploaded to S3"

    print_step "Invalidating CloudFront cache..."
    aws cloudfront create-invalidation --distribution-id "$dist_id" --paths "/*" > /dev/null
    print_success "CloudFront invalidation created"
    print_success "${site_name} deployed!"
    echo "  📚 https://tutorials.aws-study-flashcards-app.com"
}

# Hidden test builds at <site>/next/ (sign-in switch, migration step 2).
# Built with base /next/ into dist-next/; normal deploys leave next/ alone.
deploy_next() {
    print_header "Deploying hidden test versions (/next/)"
    local failed=0
    local entry folder bucket dist_id
    for entry in \
        "aws-study-homepage aws-study-flashcards-app-home E3D126UT3L72OL aws-study-flashcards-app.com" \
        "aws-cloud-practitioner-game cloud.aws-study-flashcards-app.com E6NUXKK8FTCR1 cloud.aws-study-flashcards-app.com" \
        "aws-ai-study-game ai.aws-study-flashcards-app.com E23TPCWLVKFC65 ai.aws-study-flashcards-app.com" \
        "aws-saa-study-game saa.aws-study-flashcards-app.com EBOXWN6EUZHKF architect.aws-study-flashcards-app.com" \
        "aws-dva-study-game dva.aws-study-flashcards-app.com E2UB744W5YUCTW developer.aws-study-flashcards-app.com"; do
        local parts=(${=entry})
        folder=${parts[1]}; bucket=${parts[2]}; dist_id=${parts[3]}
        print_step "${folder} -> https://${parts[4]}/next/"
        cd "${SCRIPT_DIR}/${folder}" || { ((failed++)); continue; }
        if [ ! -f .env ]; then
            print_error ".env missing in $folder — skipping"
            ((failed++)); cd "$SCRIPT_DIR"; continue
        fi
        [ -d node_modules ] || npm install
        if npx vite build --base=/next/ --outDir dist-next --emptyOutDir > /dev/null; then
            aws s3 sync dist-next/ "s3://${bucket}/next/" --delete --exclude "index.html" \
                --cache-control "max-age=31536000,public" > /dev/null
            aws s3 cp dist-next/index.html "s3://${bucket}/next/index.html" \
                --cache-control "no-cache,no-store,must-revalidate" > /dev/null
            aws cloudfront create-invalidation --distribution-id "$dist_id" --paths "/next/*" > /dev/null
            print_success "${parts[4]}/next/"
        else
            print_error "Build failed: $folder"; ((failed++))
        fi
        cd "$SCRIPT_DIR"
    done
    [ $failed -eq 0 ] && print_success "All 5 test versions deployed" || print_error "$failed failed"
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
    echo ""
    deploy_saa || ((failed++))
    echo ""
    deploy_dva || ((failed++))
    echo ""
    deploy_bash || ((failed++))
    echo ""
    deploy_python || ((failed++))
    echo ""
    deploy_tutorials || ((failed++))

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    print_header "Deployment Complete!"
    echo ""
    if [ $failed -eq 0 ]; then
        print_success "All 8 sites deployed successfully in ${duration} seconds"
    else
        print_error "$failed deployment(s) failed"
    fi
    echo ""
    echo "  🌐 Hub:   https://aws-study-flashcards-app.com"
    echo "  ☁️  Cloud: https://cloud.aws-study-flashcards-app.com"
    echo "  🤖 AI:    https://ai.aws-study-flashcards-app.com"
    echo "  🏗️  Architect: https://architect.aws-study-flashcards-app.com"
    echo "  👨‍💻 Developer: https://developer.aws-study-flashcards-app.com"
    echo "  💲 Bash:  https://bash.aws-study-flashcards-app.com"
    echo "  🐍 Python: https://python.aws-study-flashcards-app.com"
    echo "  📚 Tuts:  https://tutorials.aws-study-flashcards-app.com"
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
    saa)
        deploy_saa
        ;;
    dva)
        deploy_dva
        ;;
    bash)
        deploy_bash
        ;;
    python)
        deploy_python
        ;;
    tutorials|tuts)
        deploy_tutorials
        ;;
    next)
        deploy_next
        ;;
    -h|--help)
        echo "Usage: $0 [all|hub|cloud|ai|saa|dva|bash|python|tutorials|next]"
        echo ""
        echo "Options:"
        echo "  all    Deploy all eight sites"
        echo "  hub    Deploy Study Hub Homepage only"
        echo "  cloud  Deploy Cloud Practitioner Game only"
        echo "  ai     Deploy AI Study Game only"
        echo "  saa    Deploy Solutions Architect Study Game only"
        echo "  dva    Deploy Developer Associate Study Game only"
        echo "  bash   Deploy the Bash for AWS course site only"
        echo "  python Deploy the Python for AWS course site only"
        echo "  tutorials  Deploy Tutorials site only (static, no build)"
        echo "  next   Deploy hidden test versions of the 5 apps at /next/"
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
        echo "  5) saa    - Solutions Architect Study Game"
        echo "  6) dva    - Developer Associate Study Game"
        echo "  7) tutorials - Tutorials site"
        echo "  8) bash   - Bash for AWS course"
        echo "  9) python - Python for AWS course"
        echo ""
        read "choice?Enter choice [all/hub/cloud/ai/saa/dva/tutorials/bash/python]: "
        
        case $choice in
            1|all) deploy_all ;;
            2|hub) deploy_hub ;;
            3|cloud) deploy_cloud ;;
            4|ai) deploy_ai ;;
            5|saa) deploy_saa ;;
            6|dva) deploy_dva ;;
            7|tutorials|tuts) deploy_tutorials ;;
            8|bash) deploy_bash ;;
            9|python) deploy_python ;;
            *) print_error "Invalid choice" ;;
        esac
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Run '$0 --help' for usage information."
        exit 1
        ;;
esac
