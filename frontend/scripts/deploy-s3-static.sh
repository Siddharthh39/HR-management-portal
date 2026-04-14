#!/usr/bin/env bash
set -euo pipefail

REGION="${AWS_REGION:-ap-south-1}"
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
BUCKET_NAME="${1:-hr-management-portal-frontend-${ACCOUNT_ID}-${REGION}}"
API_BASE_URL="${VITE_API_BASE_URL:-https://qihk58gv4g.execute-api.ap-south-1.amazonaws.com/prod}"

cd "$(dirname "$0")/.."

echo "Using bucket: ${BUCKET_NAME}"
echo "Using region: ${REGION}"
echo "Using API base URL: ${API_BASE_URL}"

if ! aws s3api head-bucket --bucket "${BUCKET_NAME}" 2>/dev/null; then
  echo "Creating bucket ${BUCKET_NAME} ..."
  if [[ "${REGION}" == "us-east-1" ]]; then
    aws s3api create-bucket --bucket "${BUCKET_NAME}"
  else
    aws s3api create-bucket \
      --bucket "${BUCKET_NAME}" \
      --create-bucket-configuration LocationConstraint="${REGION}" \
      --region "${REGION}"
  fi
fi

# Allow public read access for static website hosting.
aws s3api put-public-access-block \
  --bucket "${BUCKET_NAME}" \
  --public-access-block-configuration \
  BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false

aws s3api put-bucket-policy \
  --bucket "${BUCKET_NAME}" \
  --policy "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Sid\":\"PublicReadGetObject\",\"Effect\":\"Allow\",\"Principal\":\"*\",\"Action\":[\"s3:GetObject\"],\"Resource\":[\"arn:aws:s3:::${BUCKET_NAME}/*\"]}]}"

aws s3 website "s3://${BUCKET_NAME}" --index-document index.html --error-document index.html

if [[ -f package-lock.json ]]; then
  if ! npm ci; then
    echo "npm ci failed due to lock mismatch, falling back to npm install ..."
    npm install
  fi
else
  npm install
fi

VITE_API_BASE_URL="${API_BASE_URL}" npm run build
aws s3 sync dist/ "s3://${BUCKET_NAME}" --delete

WEBSITE_URL="http://${BUCKET_NAME}.s3-website.${REGION}.amazonaws.com"

echo "Deployment complete."
echo "Website URL: ${WEBSITE_URL}"
