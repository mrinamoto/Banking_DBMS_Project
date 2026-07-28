# Beginner Setup

This guide runs the Banking Management System from an existing clone of this repository.

## 1. Install tools

- Install Node.js 20 or newer.
- Install Git.
- Install SQLcl or SQL Developer for running Oracle SQL scripts.
- Use Oracle Database Free in Oracle Cloud, not a local XE database.

## 2. Install dependencies

From the repository root:

```bash
npm install
npm --prefix client install
npm --prefix server install
```

## 3. Configure backend environment

Copy `server/.env.example` to `server/.env` and fill in values from Oracle Cloud:

```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
DB_USER=BANK_APP
DB_PASSWORD=your_cloud_database_password
DB_CONNECT_STRING=your_autonomous_database_connection_string
DB_POOL_MIN=1
DB_POOL_MAX=5
SESSION_SECRET=use_a_random_value_with_at_least_32_characters
```

## 4. Install the Oracle schema

Connect as the application database user and run:

```sql
@database/run_all.sql
```

## 5. Create demo role users

After sample data is installed:

```bash
npm --prefix server run seed:demo-users -- ClassroomPass123
```

This creates `admin`, `manager`, `employee`, and `customer` users with the password you provide.

## 6. Start the backend

```bash
npm --prefix server start
```

Open `http://localhost:5000/api/health`. It should show the API and Oracle connection are available.

## 7. Start the frontend

```bash
npm --prefix client run dev
```

Open `http://localhost:5173/login`.

## Screenshot Placeholders

- `[Screenshot: backend terminal showing Banking API listening]`
- `[Screenshot: browser showing /api/health database connected]`
- `[Screenshot: React login page]`
- `[Screenshot: dashboard after successful login]`
