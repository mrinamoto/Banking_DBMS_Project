# Oracle Database Free Setup

Use Oracle Autonomous Database Free from Oracle Cloud so faculty can demo the project from any computer with a browser. Oracle documentation confirms Always Free Autonomous AI Database is available for Oracle Cloud Free Tier accounts and supports standard Oracle client connections.

Official references:

- [Oracle Autonomous Database Serverless](https://docs.oracle.com/en/cloud/paas/autonomous-database/serverless/)
- [Create Autonomous Database tutorial](https://docs.oracle.com/en/cloud/paas/atp-cloud/tutorial-getting-started-autonomous-db/index.html)
- [Connect to Autonomous Database](https://docs.oracle.com/en-us/iaas/autonomous-database-shared/doc/connect-autonomous-database.html)
- [Download wallet information](https://docs.oracle.com/en/cloud/paas/autonomous-database/serverless/adbsb/connect-download-wallet.html)

## 1. Create Oracle Database Free account

1. Go to `https://cloud.oracle.com/free`.
2. Create or sign in to an Oracle Cloud Free Tier account.
3. Complete email, phone, and payment verification if Oracle asks for it.

`Optional evidence screenshot (if captured): Oracle Cloud Free signup page`

## 2. Create Oracle Database

1. Open the Oracle Cloud Console.
2. Go to Oracle Database, then Autonomous Database.
3. Click Create Autonomous Database.
4. Choose Transaction Processing or Autonomous Transaction Processing.
5. Enable Always Free if it is available in your region.
6. Create an ADMIN password and keep it private.
7. Wait until Lifecycle State becomes Available.

`Optional evidence screenshot (if captured): Create Autonomous Database form`

## 3. Create Database User

Connect as `ADMIN` using Database Actions SQL or SQL Developer and run:

```sql
CREATE USER BANK_APP IDENTIFIED BY "Use_A_Strong_Password_123";
GRANT DWROLE TO BANK_APP;
ALTER USER BANK_APP QUOTA UNLIMITED ON DATA;
```

Use the `BANK_APP` user for the application, not `ADMIN`.

`Optional evidence screenshot (if captured): Database Actions SQL worksheet creating BANK_APP`

## 4. Download credentials if required

If your database requires mTLS:

1. Open the Autonomous Database details page.
2. Click Database Connection.
3. Click Download Wallet.
4. Choose Instance wallet.
5. Create a wallet password.
6. Store the wallet securely.

`Optional evidence screenshot (if captured): Database Connection wallet download`

## 5. Find Connection String

On the Database Connection page, copy a high or low service connection string. For Render, prefer a normal `DB_CONNECT_STRING` value when mTLS is not required. If mTLS is required, also configure wallet files and `TNS_ADMIN`.

`Optional evidence screenshot (if captured): connection string list`

## 6. Configure environment variables

In `server/.env` locally, Render Environment Variables in production:

```env
DB_USER=BANK_APP
DB_PASSWORD=Use_A_Strong_Password_123
DB_CONNECT_STRING=your_connection_string
SESSION_SECRET=random_32_plus_character_secret
CLIENT_ORIGIN=https://your-vercel-app.vercel.app
```

`Optional evidence screenshot (if captured): Render environment variables`

## 7. Test connection

Start the backend and open:

```text
http://localhost:5000/api/health
```

Expected result:

```json
{ "status": "ok", "database": "connected" }
```

`Optional evidence screenshot (if captured): health endpoint connected`

## 8. Run database/run_all.sql

Connect as `BANK_APP` and run:

```sql
@database/run_all.sql
```

This installs tables, constraints, indexes, functions, packages, procedures, views, triggers, and sample data.

`Optional evidence screenshot (if captured): SQLcl running database/run_all.sql`

## 9. Compile Procedures

The `run_all.sql` script compiles procedures automatically through `database/sql/08_procedures.sql`.

Verify:

```sql
SELECT object_name, status FROM user_objects WHERE object_type = 'PROCEDURE';
```

`Optional evidence screenshot (if captured): procedure status valid`

## 10. Compile Packages

The `run_all.sql` script compiles packages through `database/sql/11_packages.sql`.

Verify:

```sql
SELECT object_name, object_type, status
FROM user_objects
WHERE object_type LIKE 'PACKAGE%';
```

`Optional evidence screenshot (if captured): package status valid`

## 11. Compile Triggers

The `run_all.sql` script compiles triggers through `database/sql/10_triggers.sql`.

Verify:

```sql
SELECT trigger_name, status FROM user_triggers;
```

`Optional evidence screenshot (if captured): trigger status enabled`

## 12. Verify USER_OBJECTS

```sql
SELECT object_type, status, COUNT(*)
FROM user_objects
GROUP BY object_type, status
ORDER BY object_type, status;
```

All important objects should be `VALID`.

`Optional evidence screenshot (if captured): USER_OBJECTS valid summary`

## 13. Verify USER_ERRORS

```sql
SELECT name, type, line, position, text
FROM user_errors
ORDER BY name, sequence;
```

This should return no rows.

`Optional evidence screenshot (if captured): USER_ERRORS no rows`

## 14. Run Acceptance Tests

Run:

```sql
@database/tests/acceptance_tests.sql
```

`Optional evidence screenshot (if captured): acceptance tests completed`

## 15. Connect Backend

Set `DB_USER`, `DB_PASSWORD`, `DB_CONNECT_STRING`, and `SESSION_SECRET` in Render or local `.env`. Start the server and verify `/api/health`.

`Optional evidence screenshot (if captured): Render backend logs connected`

## 16. Test Frontend

Set `VITE_API_URL` in Vercel to your backend URL plus `/api`, for example:

```env
VITE_API_URL=https://your-render-service.onrender.com/api
```

Open the Vercel app and sign in.

`Optional evidence screenshot (if captured): Vercel app login success`
