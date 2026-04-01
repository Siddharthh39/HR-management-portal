# HR Management Backend (Microservices)

This backend is structured for FastAPI microservices deployed as separate AWS Lambda functions behind API Gateway.

## Services

- `admin_user`: Admin/user management + permission assignment + RDS seed scripts
- `punch_in_out`: Punch in and punch out service scaffold
- `onbording`: Onboarding service scaffold
- `leave_req_submission`: Leave request service scaffold
- `salary_management`: Salary management service scaffold

## Shared Environment

The file `backend/.env` contains MySQL RDS settings shared by services.

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

- `GET /health`
- `GET /users`
- `POST /users`
- `POST /users/{user_id}/permissions`
- `GET /users/me`
- `GET /permissions`
- `POST /permissions`
