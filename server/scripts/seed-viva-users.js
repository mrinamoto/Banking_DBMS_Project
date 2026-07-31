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

async function findEmployee(connection, staffCode, label) {
  const result = await connection.execute(`SELECT e.employee_id id,e.employee_code,e.branch_id,b.status branch_status FROM employees e JOIN branches b ON b.branch_id=e.branch_id WHERE e.employee_code=:staffCode`, { staffCode });
  const row = result.rows[0];
  if (!row || row.BRANCH_STATUS !== "ACTIVE") throw new Error(`Required demo ${label} employee or active branch is missing.`);
  if (row.EMPLOYEE_CODE !== staffCode) throw new Error(`Staff code mismatch for ${label}.`);
  return row.ID;
}

async function upsertUser(connection, user) {
  await connection.execute(`
    MERGE INTO users target
    USING (SELECT :username username FROM dual) source
       ON (LOWER(target.username)=LOWER(source.username))
    WHEN MATCHED THEN UPDATE SET password_hash=:passwordHash, role=:role, customer_id=:customerId,
      employee_id=:employeeId, staff_code=:staffCode, display_name=:displayName, is_active='Y', must_change_password='Y',
      account_locked='N', failed_login_count=0, password_changed_at=NULL, updated_at=SYSTIMESTAMP
    WHEN NOT MATCHED THEN INSERT (username, password_hash, role, customer_id, employee_id, staff_code, display_name,
      is_active, must_change_password, account_locked, failed_login_count)
      VALUES (:username, :passwordHash, :role, :customerId, :employeeId, :staffCode, :displayName, 'Y', 'Y', 'N', 0)`, user);
}

async function addWelcomeNotification(connection, username) {
  await connection.execute(`INSERT INTO notifications(user_id,event_type,title,message,entity_type) SELECT user_id,'STAFF_LOGIN_CREATED','University demo account ready','Your university demonstration account requires a password change at first login.','USERS' FROM users WHERE LOWER(username)=LOWER(:username) AND NOT EXISTS (SELECT 1 FROM notifications n JOIN users u ON u.user_id=n.user_id WHERE u.username=:username AND n.event_type='STAFF_LOGIN_CREATED')`, { username });
}

async function main() {
  const { baseSecret, includeCustomer } = readOptions(process.argv.slice(2));
  if (!baseSecret || baseSecret.length < 16) throw new Error("Provide --base-secret with at least 16 characters; generated passwords are never stored in source.");
  await initializePool();
  const connection = await getConnection();
  try {
    const managerId = await findEmployee(connection, "M-ID-001", "manager");
    const employeeCodes = ["E-ID-001", "E-ID-002", "E-ID-003", "E-ID-004", "E-ID-005", "E-ID-006", "E-ID-007", "E-ID-008"];
    const employeeIds = Object.fromEntries(await Promise.all(employeeCodes.map(async (code) => [code, await findEmployee(connection, code, code)])));
    const customerId = includeCustomer ? await findPrincipal(connection, "SELECT customer_id id FROM customers WHERE national_id='NID-DEMO-001'", "customer") : null;
    const records = [
      ["admin.mrinmoy001", "A-ID-001", "ADMIN", null, "A001", "Mohammad Mrinmoy"], ["admin.monira002", "A-ID-002", "ADMIN", null, "A002", "Sirajum Monira"],
      ["admin.ashik003", "A-ID-003", "ADMIN", null, "A003", "Ashik Uz-zaman"], ["admin.asif004", "A-ID-004", "ADMIN", null, "A004", "Ikhteir Asif"],
      ["mayen.majumder001", "M-ID-001", "MANAGER", managerId, "M001", "Mayen Majumder"],
      ...employeeCodes.map((code, index) => [`${["mashrur.hasan001", "risha.khan002", "samin.hasan003", "abrar.karib004", "rakib.hasan005", "prapto.sorkar006", "sayba.tasnim007", "tasnia.suborno008"][index]}`, code, "EMPLOYEE", employeeIds[code], `E00${index + 1}`, ["Mashrur Hasan", "Risha Khan", "Samin Hasan", "Abrar Karib", "Rakib Hasan", "Prapto Sorkar", "Sayba Tasnim", "Tasnia Suborno"][index]]),
    ].map(([username, staffCode, role, employeeId, suffix, displayName]) => ({ username, staffCode, role, employeeId, displayName, customerId: null, suffix }));
    if (includeCustomer) records.push({ username: "customer001", role: "CUSTOMER", staffCode: null, employeeId: null, customerId, suffix: "C001" });
    for (const record of records) { await upsertUser(connection, { ...record, passwordHash: await hashPassword(`${baseSecret}-${record.suffix}`) }); await addWelcomeNotification(connection, record.username); }
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
