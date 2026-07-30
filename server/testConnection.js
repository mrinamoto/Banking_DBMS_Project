const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });

const { getConnection, closePool } = require("./config/db");

function errorCategory(error) {
  const code = String(error?.code || "").toUpperCase();
  const oracleCode = String(error?.message || "").match(/ORA-\d+/)?.[0];
  if (code === "ECONNREFUSED" || code === "ETIMEDOUT" || code === "EHOSTUNREACH") return "network/unreachable listener";
  if (oracleCode === "ORA-01017") return "invalid database credentials";
  if (oracleCode === "ORA-12154" || oracleCode === "ORA-12514") return "invalid connect string or service name";
  if (oracleCode === "ORA-28000") return "database account is locked";
  if (oracleCode) return `Oracle ${oracleCode}`;
  if (/^NJS-5\d+$/i.test(code)) return `Oracle driver ${code}`;
  if (/Missing required environment variables/.test(String(error?.message))) return "missing database environment variables";
  return "database configuration or connectivity";
}

async function testConnection() {
  let connection;
  let succeeded = false;

  try {
    connection = await getConnection();
    await connection.execute("SELECT 1 AS connection_test FROM dual");
    succeeded = true;
    console.log("Database connection succeeded (SELECT 1 FROM dual).");
  } catch (error) {
    console.error(`Database connection failed: ${errorCategory(error)}.`);
  } finally {
    if (connection) {
      await connection.close();
    }
    await closePool();
    process.exitCode = succeeded ? 0 : 1;
  }
}

testConnection();
