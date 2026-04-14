# AWS API Gateway Endpoints

All Lambda functions are deployed on AWS and accessible via API Gateway at:

**Base URL:** `https://rkskrnxx50.execute-api.ap-south-1.amazonaws.com/prod`

## Service Endpoints

### Admin User Service
- **Base:** `https://rkskrnxx50.execute-api.ap-south-1.amazonaws.com/prod/admin-user`
- Health Check: `GET /admin-user/health`
- List Users: `GET /admin-user/users`
- Create User: `POST /admin-user/users`
- Get User Profile: `GET /admin-user/users/me`
- Assign Permissions: `POST /admin-user/users/{user_id}/permissions`
- List Permissions: `GET /admin-user/permissions`
- Create Permission: `POST /admin-user/permissions`

### Leave Request Service
- **Base:** `https://rkskrnxx50.execute-api.ap-south-1.amazonaws.com/prod/leave-requests`
- Health: `GET /leave-requests/health`
- DB Health: `GET /leave-requests/db/health`
- List Tables: `GET /leave-requests/db/tables`
- Query: `GET /leave-requests/db/query?table=TABLE_NAME`

### Onboarding Service
- **Base:** `https://rkskrnxx50.execute-api.ap-south-1.amazonaws.com/prod/onboarding`
- Health: `GET /onboarding/health`
- DB Health: `GET /onboarding/db/health`
- List Tables: `GET /onboarding/db/tables`
- Query: `GET /onboarding/db/query?table=TABLE_NAME`

### Punch In/Out Service
- **Base:** `https://rkskrnxx50.execute-api.ap-south-1.amazonaws.com/prod/punch-in-out`
- Health: `GET /punch-in-out/health`
- DB Health: `GET /punch-in-out/db/health`
- List Tables: `GET /punch-in-out/db/tables`
- Query: `GET /punch-in-out/db/query?table=TABLE_NAME`

### Salary Management Service
- **Base:** `https://rkskrnxx50.execute-api.ap-south-1.amazonaws.com/prod/salary-management`
- Health: `GET /salary-management/health`
- DB Health: `GET /salary-management/db/health`
- List Tables: `GET /salary-management/db/tables`
- Query: `GET /salary-management/db/query?table=TABLE_NAME`

---

## Quick Test

Test all services:
```bash
BASE="https://rkskrnxx50.execute-api.ap-south-1.amazonaws.com/prod"

curl "$BASE/admin-user/health"
curl "$BASE/leave-requests/health"
curl "$BASE/onboarding/health"
curl "$BASE/punch-in-out/health"
curl "$BASE/salary-management/health"
```

Admin operations (requires `X-Actor-Email` header):
```bash
curl -H "X-Actor-Email: admin@hr.local" \
  "$BASE/admin-user/users"
```

Query databases:
```bash
curl "$BASE/leave-requests/db/tables"
curl "$BASE/leave-requests/db/query?table=users&limit=10"
```
