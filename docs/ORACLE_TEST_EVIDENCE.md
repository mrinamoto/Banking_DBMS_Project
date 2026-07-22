# Oracle Test Evidence

Status: **Pending local Oracle execution**. On 22 July 2026, `/api/health` returned HTTP 503 because the configured listener at `127.0.0.1:1521` refused the connection. No installer was run.

## Environment

| Field | Value |
|---|---|
| Oracle version | Pending |
| Tool (SQL Developer/SQLcl/SQL*Plus) | Pending |
| Test schema name (no password) | Pending |
| Execution date | Pending |

## Installer evidence

Run from repository root:

```powershell
sqlplus bank_app@localhost:1521/FREEPDB1 `@database/run_all.sql
```

Paste the final `USER_ERRORS` result here. Expected: no rows.

## Invalid-object evidence

```sql
SELECT object_name, object_type, status
FROM user_objects
WHERE status <> 'VALID'
ORDER BY object_type, object_name;
```

Actual output: Pending. Expected: no project-owned rows.

## Acceptance evidence

```sql
@database/tests/acceptance_tests.sql
```

Actual summary: Pending. Required result: `FAILED : 0` and `FINAL RESULT: PASS`.

Do not change this document to “Pass” unless the real console output has been captured. Screenshots may be stored under `docs/evidence/` and linked here.
