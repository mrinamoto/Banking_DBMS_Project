const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env"), quiet: true });

const { getConnection, closePool, requiredDatabaseConfig } = require("../config/db");

const requiredTables = [
  "BANK_PROFILE", "BRANCHES", "CUSTOMERS", "EMPLOYEES", "USERS", "LOGIN_HISTORY", "ACCOUNT_TYPES", "ACCOUNTS",
  "TRANSACTIONS", "FUND_TRANSFERS", "TRANSACTION_REVERSALS", "LOAN_TYPES", "LOANS", "LOAN_PAYMENTS",
  "AUDIT_LOG", "BENEFICIARIES", "CUSTOMER_KYC", "USER_PREFERENCES", "DEPOSIT_SCHEMES", "DEPOSIT_CERTIFICATES", "NOTIFICATIONS", "SERVICE_REQUESTS",
];

function category(error) {
  const code = String(error?.code || "").toUpperCase();
  const oracleCode = String(error?.message || "").match(/ORA-\d+/)?.[0];
  if (oracleCode === "ORA-01017") return "invalid database credentials";
  if (oracleCode === "ORA-12154" || oracleCode === "ORA-12514") return "invalid connect string or service name";
  if (/^NJS-5\d+$/i.test(code)) return `Oracle driver ${code}`;
  if (/Missing required environment variables/.test(String(error?.message))) return "missing database environment variables";
  return oracleCode ? `Oracle ${oracleCode}` : "database configuration or connectivity";
}

async function main() {
  const missing = ["DB_USER", "DB_PASSWORD", "DB_CONNECT_STRING"].filter((name) => !process.env[name]);
  console.log(`Configuration: required variables ${missing.length ? `missing (${missing.join(", ")})` : "present"}; wallet mode ${process.env.DB_WALLET_DIR ? "enabled" : "disabled"}.`);
  if (missing.length) return 1;

  let connection;
  try {
    requiredDatabaseConfig();
    connection = await getConnection();
    await connection.execute("SELECT 1 AS connection_test FROM dual");
    console.log("Connection: SELECT 1 FROM dual succeeded.");

    const tableResult = await connection.execute(
      `SELECT table_name FROM user_tables WHERE table_name IN (${requiredTables.map((_, index) => `:table${index}`).join(",")})`,
      Object.fromEntries(requiredTables.map((table, index) => [`table${index}`, table])),
    );
    const found = new Set(tableResult.rows.map((row) => row.TABLE_NAME));
    const missingTables = requiredTables.filter((table) => !found.has(table));
    if (missingTables.length) console.error(`Missing tables: ${missingTables.join(", ")}`);
    else console.log(`Core tables: ${requiredTables.length}/${requiredTables.length} present.`);

    const userColumns = await connection.execute("SELECT column_name FROM user_tab_columns WHERE table_name='USERS' AND column_name IN ('STAFF_CODE','DISPLAY_NAME','EMPLOYEE_ID','CUSTOMER_ID')");
    const requiredColumns = new Set(userColumns.rows.map((row) => row.COLUMN_NAME));
    const missingColumns = ["STAFF_CODE", "DISPLAY_NAME", "EMPLOYEE_ID", "CUSTOMER_ID"].filter((column) => !requiredColumns.has(column));
    if (missingColumns.length) console.error(`Missing USERS columns: ${missingColumns.join(", ")}`);
    else console.log("USERS staff/customer columns: present.");

    const packageResult = await connection.execute("SELECT object_name,object_type,status FROM user_objects WHERE object_name IN ('PKG_BANKING_OPERATIONS','PKG_LOAN_OPERATIONS') AND object_type IN ('PACKAGE','PACKAGE BODY') ORDER BY object_name,object_type");
    const invalidPackages = packageResult.rows.filter((row) => row.STATUS !== "VALID" || !["PKG_BANKING_OPERATIONS", "PKG_LOAN_OPERATIONS"].includes(row.OBJECT_NAME) || !["PACKAGE", "PACKAGE BODY"].includes(row.OBJECT_TYPE));
    if (packageResult.rows.length < 4 || invalidPackages.length) console.error("Required banking package specifications/bodies are incomplete or invalid.");
    else console.log("Required banking package specifications/bodies: VALID.");

    const staffResult = await connection.execute("SELECT COUNT(*) staff_count FROM employees WHERE employee_code IN ('A-ID-001','A-ID-002','A-ID-003','A-ID-004','M-ID-001','E-ID-001','E-ID-002','E-ID-003','E-ID-004','E-ID-005','E-ID-006','E-ID-007','E-ID-008') AND status='ACTIVE'");
    const staffCount = Number(staffResult.rows[0]?.STAFF_COUNT || 0);
    if (staffCount !== 13) console.error(`Named active staff entities: ${staffCount}/13.`);
    else console.log("Named active staff entities: 13/13.");

    const constraintResult = await connection.execute("SELECT COUNT(*) constraint_count FROM user_constraints WHERE constraint_name IN ('CK_USER_PRINCIPAL','UK_USERS_STAFF_CODE','UK_USER_EMPLOYEE','UK_USER_CUSTOMER') AND table_name='USERS'");
    console.log(`Unified USERS constraints found: ${Number(constraintResult.rows[0]?.CONSTRAINT_COUNT || 0)}.`);

    const invalidResult = await connection.execute("SELECT object_name, object_type, status FROM user_objects WHERE status <> 'VALID' ORDER BY object_type, object_name");
    const errorResult = await connection.execute("SELECT name, type, line, position, text FROM user_errors ORDER BY name, sequence");
    if (invalidResult.rows.length) console.error(`Invalid objects: ${invalidResult.rows.map((row) => `${row.OBJECT_TYPE}:${row.OBJECT_NAME}`).join(", ")}`);
    else console.log("Invalid objects: none.");
    if (errorResult.rows.length) console.error(`USER_ERRORS rows: ${errorResult.rows.length}.`);
    else console.log("USER_ERRORS: none.");
    return missingTables.length || missingColumns.length || packageResult.rows.length < 4 || invalidPackages.length || staffCount !== 13 || invalidResult.rows.length || errorResult.rows.length ? 1 : 0;
  } catch (error) {
    console.error(`Database doctor failed: ${category(error)}.`);
    return 1;
  } finally {
    if (connection) await connection.close();
    await closePool();
  }
}

main().then((code) => { process.exitCode = code; });
