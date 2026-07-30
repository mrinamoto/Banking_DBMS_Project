const path = require("node:path");
const dotenv = require("dotenv");
const { getConnection, initializePool, closePool } = require("../config/db");
const { hashPassword } = require("../utils/passwords");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

function readOptions(argv) {
  const secretIndex = argv.indexOf("--base-secret");
  const baseSecret = secretIndex >= 0 ? argv[secretIndex + 1] : "";
  return { baseSecret, includeCustomer: argv.includes("--include-customer") };
}

async function findPrincipal(connection, sql, label) {
  const result = await connection.execute(sql);
  if (!result.rows[0]?.ID) throw new Error(`Required demo ${label} record is missing; install the classroom sample data first.`);
  return result.rows[0].ID;
}

async function upsertUser(connection, user) {
  await connection.execute(`
    MERGE INTO users target
    USING (SELECT :username username FROM dual) source
       ON (LOWER(target.username)=LOWER(source.username))
    WHEN MATCHED THEN UPDATE SET password_hash=:passwordHash, role=:role, customer_id=:customerId,
      employee_id=:employeeId, staff_code=:staffCode, is_active='Y', must_change_password='Y',
      account_locked='N', failed_login_count=0, password_changed_at=NULL, updated_at=SYSTIMESTAMP
    WHEN NOT MATCHED THEN INSERT (username, password_hash, role, customer_id, employee_id, staff_code,
      is_active, must_change_password, account_locked, failed_login_count)
      VALUES (:username, :passwordHash, :role, :customerId, :employeeId, :staffCode, 'Y', 'Y', 'N', 0)`, user);
}

async function main() {
  const { baseSecret, includeCustomer } = readOptions(process.argv.slice(2));
  if (!baseSecret || baseSecret.length < 16) throw new Error("Provide --base-secret with at least 16 characters; generated passwords are never stored in source.");
  await initializePool();
  const connection = await getConnection();
  try {
    const managerId = await findPrincipal(connection, "SELECT employee_id id FROM employees WHERE employee_code='M-ID-001' AND status='ACTIVE'", "manager");
    const employeeId = await findPrincipal(connection, "SELECT employee_id id FROM employees WHERE employee_code='E-ID-001' AND status='ACTIVE'", "employee");
    const customerId = includeCustomer ? await findPrincipal(connection, "SELECT customer_id id FROM customers WHERE national_id='NID-DEMO-001'", "customer") : null;
    const records = [
      { username: "admin001", role: "ADMIN", staffCode: "A-ID-001", employeeId: null, customerId: null, suffix: "A001" },
      { username: "ann.noor001", role: "MANAGER", staffCode: "M-ID-001", employeeId: managerId, customerId: null, suffix: "M001" },
      { username: "rafi.ahmed001", role: "EMPLOYEE", staffCode: "E-ID-001", employeeId, customerId: null, suffix: "E001" },
    ];
    if (includeCustomer) records.push({ username: "customer001", role: "CUSTOMER", staffCode: null, employeeId: null, customerId, suffix: "C001" });
    for (const record of records) await upsertUser(connection, { ...record, passwordHash: await hashPassword(`${baseSecret}-${record.suffix}`) });
    await connection.commit();
    console.log("University demonstration accounts only. Temporary passwords are shown once; change them at first login.");
    records.forEach((record) => console.log(`${record.username}\t${record.staffCode || "customer"}\t${baseSecret}-${record.suffix}`));
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.close();
    await closePool();
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
