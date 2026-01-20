#!/bin/bash
# AWS Study Hub Homepage - Deployment Script
# Uses existing infrastructure

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Your existing infrastructure
BUCKET_NAME="aws-study-flashcards-app-home"
DISTRIBUTION_ID="E3D126UT3L72OL"
WEBSITE_URL="https://aws-study-flashcards-app.com"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}AWS Study Hub - Homepage Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Build
echo -e "\n${YELLOW}Building application...${NC}"
npm run build
echo -e "${GREEN}✓ Build complete${NC}"

# Upload files
echo -e "\n${YELLOW}Uploading files to S3...${NC}"
aws s3 sync dist/ s3://$BUCKET_NAME/ \
    --delete \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "index.html"

aws s3 cp dist/index.html s3://$BUCKET_NAME/index.html \
    --cache-control "no-cache, no-store, must-revalidate"

echo -e "${GREEN}✓ Files uploaded${NC}"

# Invalidate cache
echo -e "\n${YELLOW}Invalidating CloudFront cache...${NC}"
aws cloudfront create-invalidation \
    --distribution-id $DISTRIBUTION_ID \
    --paths "/*" > /dev/null
echo -e "${GREEN}✓ Cache invalidation started${NC}"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\nHomepage: ${WEBSITE_URL}"
echo -e "AI Practitioner: https://ai.aws-study-flashcards-app.com"
echo -e "Cloud Practitioner: https://cloud.aws-study-flashcards-app.com"
