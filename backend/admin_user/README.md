# Admin User Service

FastAPI service for HR admin and user management with role checks and permission mapping.

## Capabilities

- Admin can create users
- Admin can assign permission scopes (for now: `aws.ec2`)
- Users can fetch their own profile with permissions
- MySQL schema + seed scripts for AWS RDS

## Local run

```bash
cd backend/admin_user
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

## Lambda handler

`app.lambda_handler.handler`

## Seed data

```bash
cd backend/admin_user
python scripts/seed_admin_users.py
```

## Authentication model (current)

Pass `X-Actor-Email` in headers.
Only users with `is_admin=true` can create users and change permissions.
