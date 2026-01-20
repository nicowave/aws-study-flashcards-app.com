#!/bin/bash
# AWS Cloud Practitioner Study Game - Deployment Script
# Uses existing infrastructure

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Your existing infrastructure
BUCKET_NAME="cloud.aws-study-flashcards-app.com"
DISTRIBUTION_ID="E6NUXKK8FTCR1"
WEBSITE_URL="https://cloud.aws-study-flashcards-app.com"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}AWS Cloud Practitioner - Deployment${NC}"
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
echo -e "\nSite URL: ${WEBSITE_URL}"
