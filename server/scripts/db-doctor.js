const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env"), quiet: true });

const { getConnection, closePool, requiredDatabaseConfig } = require("../config/db");

const requiredTables = [
  "BRANCHES", "CUSTOMERS", "EMPLOYEES", "USERS", "LOGIN_HISTORY", "ACCOUNT_TYPES", "ACCOUNTS",
  "TRANSACTIONS", "FUND_TRANSFERS", "TRANSACTION_REVERSALS", "LOAN_TYPES", "LOANS", "LOAN_PAYMENTS",
  "AUDIT_LOG", "BENEFICIARIES", "CUSTOMER_KYC", "USER_PREFERENCES", "DEPOSIT_SCHEMES", "DEPOSIT_CERTIFICATES",
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

    const invalidResult = await connection.execute("SELECT object_name, object_type, status FROM user_objects WHERE status <> 'VALID' ORDER BY object_type, object_name");
    const errorResult = await connection.execute("SELECT name, type, line, position, text FROM user_errors ORDER BY name, sequence");
    if (invalidResult.rows.length) console.error(`Invalid objects: ${invalidResult.rows.map((row) => `${row.OBJECT_TYPE}:${row.OBJECT_NAME}`).join(", ")}`);
    else console.log("Invalid objects: none.");
    if (errorResult.rows.length) console.error(`USER_ERRORS rows: ${errorResult.rows.length}.`);
    else console.log("USER_ERRORS: none.");
    return missingTables.length || invalidResult.rows.length || errorResult.rows.length ? 1 : 0;
  } catch (error) {
    console.error(`Database doctor failed: ${category(error)}.`);
    return 1;
  } finally {
    if (connection) await connection.close();
    await closePool();
  }
}

main().then((code) => { process.exitCode = code; });
