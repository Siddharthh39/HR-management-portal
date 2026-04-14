# AWS Deployment Guide

## Prerequisites

1. **AWS Account** with appropriate permissions (Lambda, API Gateway, RDS access)
2. **AWS CLI** configured with credentials
3. **SAM CLI** installed
4. **Python 3.12+**
5. **Docker** (for SAM local testing)

## Setup AWS Credentials

```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter your default region (ap-south-1)
# Enter default output format (json)
```

Verify credentials:
```bash
aws sts get-caller-identity
```

## Update Template Configuration

Edit `backend/template.yaml` and update the Globals > Function > Environment > Variables section with your actual AWS credentials:

```yaml
Environment:
  Variables:
    MYSQL_HOST: your-rds-endpoint
    MYSQL_PORT: "3306"
    MYSQL_USER: your-db-user
    MYSQL_PASSWORD: your-db-password
    MYSQL_DATABASE: hr_management
```

## Deploy to AWS

### 1. Build the SAM Template
```bash
cd backend
sam build
```

### 2. Deploy with SAM (Guided - First Time)
```bash
sam deploy --guided

# When prompted:
# Stack Name: hr-management-portal
# Region: ap-south-1
# Confirm changes before deploy: Y
# Allow SAM CLI IAM role creation: Y
# Save parameters: Y
```

### 3. Subsequent Deployments
```bash
sam deploy
```

### Get Deployment Info
After deployment, retrieve your API endpoint:
```bash
aws cloudformation describe-stacks \
  --stack-name hr-management-portal \
  --region ap-south-1 \
  --query 'Stacks[0].Outputs' \
  --output table
```

The output will show your **HrHttpApiEndpoint** (base URL for all requests).

## Local Testing (Before AWS Deployment)

```bash
cd backend
sam local start-api
# API runs at http://127.0.0.1:3000

# Test admin-user health
curl http://127.0.0.1:3000/prod/admin-user/health
```

---

# Test Endpoints

Replace `BASE_URL` with your actual API endpoint from deployment (e.g., `https://rkskrnxx50.execute-api.ap-south-1.amazonaws.com/prod`).

## Admin User Service

### Health Check
```bash
curl -X GET "https://BASE_URL/admin-user/health"
```

### List Users (requires X-Actor-Email header with admin account)
```bash
curl -X GET "https://BASE_URL/admin-user/users" \
  -H "X-Actor-Email: admin@hr.local"
```

### Create User (admin only)
```bash
curl -X POST "https://BASE_URL/admin-user/users" \
  -H "X-Actor-Email: admin@hr.local" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "is_admin": false
  }'
```

### Get Current User Profile
```bash
curl -X GET "https://BASE_URL/admin-user/users/me" \
  -H "X-Actor-Email: admin@hr.local"
```

### List Permissions
```bash
curl -X GET "https://BASE_URL/admin-user/permissions"
```

### Create Permission (admin only)
```bash
curl -X POST "https://BASE_URL/admin-user/permissions" \
  -H "X-Actor-Email: admin@hr.local" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "aws.ec2.manage",
    "description": "Can manage EC2 instances"
  }'
```

### Assign Permissions to User (admin only)
```bash
curl -X POST "https://BASE_URL/admin-user/users/1/permissions" \
  -H "X-Actor-Email: admin@hr.local" \
  -H "Content-Type: application/json" \
  -d '{
    "permission_names": ["aws.ec2.manage"]
  }'
```

## Leave Request Service

### Health Check
```bash
curl -X GET "https://BASE_URL/leave-requests/health"
```

### Database Health
```bash
curl -X GET "https://BASE_URL/leave-requests/db/health"
```

### List Tables
```bash
curl -X GET "https://BASE_URL/leave-requests/db/tables"
```

### Query Leave Requests (all records)
```bash
curl -X GET "https://BASE_URL/leave-requests/db/query?table=leave_requests&limit=50"
```

### Query with Filters
```bash
curl -X GET "https://BASE_URL/leave-requests/db/query?table=leave_requests&filters=status:approved&limit=20"
```

### Query Single Record
```bash
curl -X GET "https://BASE_URL/leave-requests/db/query/leave_requests/1?id_column=id"
```

## Onboarding Service

### Health Check
```bash
curl -X GET "https://BASE_URL/onboarding/health"
```

### List Tables
```bash
curl -X GET "https://BASE_URL/onboarding/db/tables"
```

### Query Onboarding Records
```bash
curl -X GET "https://BASE_URL/onboarding/db/query?table=onboarding_tasks&limit=50&order_by=id&order_dir=asc"
```

## Punch In/Out Service

### Health Check
```bash
curl -X GET "https://BASE_URL/punch-in-out/health"
```

### Query Attendance Records
```bash
curl -X GET "https://BASE_URL/punch-in-out/db/query?table=attendance&limit=50&order_by=punch_in_time&order_dir=desc"
```

### Query User Attendance (specific user)
```bash
curl -X GET "https://BASE_URL/punch-in-out/db/query?table=attendance&filters=user_id:1&limit=30&order_by=punch_in_time&order_dir=desc"
```

## Salary Management Service

### Health Check
```bash
curl -X GET "https://BASE_URL/salary-management/health"
```

### Query Salary Records
```bash
curl -X GET "https://BASE_URL/salary-management/db/query?table=salary_records&limit=50"
```

### Query User Salary (specific user)
```bash
curl -X GET "https://BASE_URL/salary-management/db/query?table=salary_records&filters=user_id:1"
```

---

## Quick Health Check Script

```bash
#!/bin/bash
BASE_URL="https://BASE_URL"

echo "Testing HR Management Portal API..."
echo "Base URL: $BASE_URL"
echo ""

services=("admin-user" "leave-requests" "onboarding" "punch-in-out" "salary-management")

for service in "${services[@]}"; do
  echo -n "Testing $service... "
  response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/$service/health")
  if [ "$response" = "200" ]; then
    echo "✓ OK"
  else
    echo "✗ FAILED (HTTP $response)"
  fi
done
```

Save as `test-api.sh`, make executable (`chmod +x test-api.sh`), and run:
```bash
./test-api.sh
```

## Troubleshooting

### Lambda Timeout
- Increase timeout in `template.yaml` if database operations take >30s
- Check Lambda CloudWatch logs: `aws logs tail /aws/lambda/AdminUserFunction --follow`

### Database Connection Errors
- Verify RDS security group allows inbound traffic on port 3306 from Lambda
- Check Lambda IAM role has permissions (if using Secrets Manager)
- Confirm database credentials in environment variables

### CORS Errors
- CORS is already enabled in the SAM template for all origins
- For production, restrict `AllowOrigins` to your frontend domain

### View Lambda Logs
```bash
aws logs tail /aws/lambda/AdminUserFunction --follow
aws logs tail /aws/lambda/LeaveRequestFunction --follow
aws logs tail /aws/lambda/OnboardingFunction --follow
aws logs tail /aws/lambda/PunchInOutFunction --follow
aws logs tail /aws/lambda/SalaryManagementFunction --follow
```
