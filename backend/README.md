# HR Management Backend (Microservices)

This backend is structured for FastAPI microservices deployed as separate AWS Lambda functions behind API Gateway.

## Services

- `admin_user`: admin/user management and permission assignment APIs
- `leave_req_submission`: leave service with database query endpoints
- `onbording`: onboarding service with database query endpoints
- `punch_in_out`: attendance service with database query endpoints
- `salary_management`: salary service with database query endpoints

## Shared Environment

The file `backend/.env` is loaded by all services.

Required keys:

- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`
- `AUTO_CREATE_TABLES`
- `ADMIN_BOOTSTRAP_EMAIL`
- `ADMIN_BOOTSTRAP_PASSWORD`

## Lambda Functions

Each feature runs as its own Lambda function with handler `app.lambda_handler.handler`:

- `hr-admin-user`
- `hr-leave-req-submission`
- `hr-onboarding`
- `hr-punch-in-out`
- `hr-salary-management`

## Admin User Service

### Local run

```bash
cd backend/admin_user
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

### Lambda handler

Use this handler in Lambda:

`app.lambda_handler.handler`

### Seed RDS data (Python)

```bash
cd backend/admin_user
python scripts/seed_admin_users.py
```

### Seed RDS data (SQL)

```bash
mysql -h management.ctqigesoqgvs.ap-south-1.rds.amazonaws.com -P 3306 -u admin -p < scripts/seed_admin_users.sql
```

## Admin API quick guide

Use header `X-Actor-Email` to identify the acting user.
Only users with `is_admin=true` can create users or update permissions.

- `GET /admin-user/health`
- `GET /admin-user/users`
- `POST /admin-user/users`
- `POST /admin-user/users/{user_id}/permissions`
- `GET /admin-user/users/me`
- `GET /admin-user/permissions`
- `POST /admin-user/permissions`

## Deploy As One Lambda Per Feature (AWS SAM)

A SAM template is provided at `backend/template.yaml` to deploy one Lambda per backend feature:

- `AdminUserFunction` -> `CodeUri: admin_user/`, `Handler: app.lambda_handler.handler`
- `LeaveRequestFunction` -> `CodeUri: leave_req_submission/`, `Handler: app.lambda_handler.handler`
- `OnboardingFunction` -> `CodeUri: onbording/`, `Handler: app.lambda_handler.handler`
- `PunchInOutFunction` -> `CodeUri: punch_in_out/`, `Handler: app.lambda_handler.handler`
- `SalaryManagementFunction` -> `CodeUri: salary_management/`, `Handler: app.lambda_handler.handler`

### Build and deploy

```bash
cd backend
sam build
sam deploy --guided
```

## Current API Gateway Deployment

- Region: `ap-south-1`
- HTTP API ID: `rkskrnxx50`
- **Base URL:** `https://rkskrnxx50.execute-api.ap-south-1.amazonaws.com/prod`

All service endpoints use the base URL above with the service prefix (e.g., `/admin-user`, `/leave-requests`, etc.).

## API base paths

All routes are exposed under service prefixes on the same HTTP API stage:

- `/admin-user/*`
- `/leave-requests/*`
- `/onboarding/*`
- `/punch-in-out/*`
- `/salary-management/*`

## Database Query Endpoints

These are live on the following services:

- `/leave-requests`
- `/onboarding`
- `/punch-in-out`
- `/salary-management`

Per service prefix, available endpoints are:

- `GET /{prefix}/db/health`
- `GET /{prefix}/db/tables`
- `GET /{prefix}/db/query`
- `GET /{prefix}/db/query/{table}/{record_id}`

Query parameters for `GET /{prefix}/db/query`:

- `table` (required)
- `limit` (optional, default `50`, max `500`)
- `offset` (optional, default `0`)
- `order_by` (optional)
- `order_dir` (optional: `asc` or `desc`)
- `filters` (optional, repeatable format: `filters=column:value`)

## Query Examples

```bash
# List tables
curl "https://rkskrnxx50.execute-api.ap-south-1.amazonaws.com/prod/leave-requests/db/tables"

# Query users table
curl "https://rkskrnxx50.execute-api.ap-south-1.amazonaws.com/prod/leave-requests/db/query?table=users&limit=10&order_by=id&order_dir=asc"

# Query with filters
curl "https://rkskrnxx50.execute-api.ap-south-1.amazonaws.com/prod/punch-in-out/db/query?table=users&filters=is_admin:1"

# Query a single record by id column
curl "https://rkskrnxx50.execute-api.ap-south-1.amazonaws.com/prod/salary-management/db/query/users/1?id_column=id"

# Admin users endpoint (requires header)
curl -H "X-Actor-Email: admin@hr.local" "https://rkskrnxx50.execute-api.ap-south-1.amazonaws.com/prod/admin-user/users"
```

## Safety Notes

- Database query endpoints are read-only (SELECT queries only).
- Table and column identifiers are validated before query execution.
- Sensitive fields are redacted from results: `password`, `password_hash`, `token`, `access_token`, `refresh_token`, `secret`, `api_key`.
- Before production use, add authentication/authorization to non-admin query endpoints.

## API Health Quick Check

```bash
API_BASE="https://rkskrnxx50.execute-api.ap-south-1.amazonaws.com/prod"
curl "$API_BASE/admin-user/health"
curl "$API_BASE/leave-requests/health"
curl "$API_BASE/onboarding/health"
curl "$API_BASE/punch-in-out/health"
curl "$API_BASE/salary-management/health"
```
