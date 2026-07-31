const path = require("node:path");
const dotenv = require("dotenv");
const { getConnection, initializePool, closePool } = require("../config/db");
const { hashPassword } = require("../utils/passwords");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const staff = [
  ["admin.mrinmoy001", "A-ID-001", "ADMIN", "A001", "Mohammad Mrinmoy"],
  ["admin.monira002", "A-ID-002", "ADMIN", "A002", "Sirajum Monira"],
  ["admin.ashik003", "A-ID-003", "ADMIN", "A003", "Ashik Uz-zaman"],
  ["admin.asif004", "A-ID-004", "ADMIN", "A004", "Ikhteir Asif"],
  ["mayen.majumder001", "M-ID-001", "MANAGER", "M001", "Mayen Majumder"],
  ["mashrur.hasan001", "E-ID-001", "EMPLOYEE", "E001", "Mashrur Hasan"],
  ["risha.khan002", "E-ID-002", "EMPLOYEE", "E002", "Risha Khan"],
  ["samin.hasan003", "E-ID-003", "EMPLOYEE", "E003", "Samin Hasan"],
  ["abrar.karib004", "E-ID-004", "EMPLOYEE", "E004", "Abrar Karib"],
  ["rakib.hasan005", "E-ID-005", "EMPLOYEE", "E005", "Rakib Hasan"],
  ["prapto.sorkar006", "E-ID-006", "EMPLOYEE", "E006", "Prapto Sorkar"],
  ["sayba.tasnim007", "E-ID-007", "EMPLOYEE", "E007", "Sayba Tasnim"],
  ["tasnia.suborno008", "E-ID-008", "EMPLOYEE", "E008", "Tasnia Suborno"],
];

function readOptions(argv) {
  const secretIndex = argv.indexOf("--base-secret");
  const baseSecret = secretIndex >= 0 ? argv[secretIndex + 1] : "";
  return { baseSecret, includeCustomer: argv.includes("--include-customer") };
}

async function findPrincipal(connection) {
  const result = await connection.execute("SELECT customer_id id FROM customers WHERE national_id='DEMO-NID-0001'");
  if (!result.rows[0]?.ID) throw new Error("Optional demo customer DEMO-NID-0001 is missing; install the classroom sample data first.");
  return result.rows[0].ID;
}

async function findEmployee(connection, staffCode) {
  const result = await connection.execute(`SELECT e.employee_id id,e.employee_code,b.status branch_status FROM employees e JOIN branches b ON b.branch_id=e.branch_id WHERE UPPER(TRIM(e.employee_code))=UPPER(TRIM(:staffCode))`, { staffCode });
  const row = result.rows[0];
  if (!row || row.BRANCH_STATUS !== "ACTIVE") throw new Error(`Required active employee ${staffCode} is missing.`);
  if (String(row.EMPLOYEE_CODE).toUpperCase() !== staffCode) throw new Error(`Staff code mismatch for ${staffCode}.`);
  return row.ID;
}

async function assertNoConflicts(connection, record) {
  const result = await connection.execute(`SELECT user_id,username,staff_code,employee_id FROM users WHERE LOWER(username)=LOWER(:username) OR LOWER(staff_code)=LOWER(:staffCode)`, { username: record.username, staffCode: record.staffCode });
  for (const row of result.rows) {
    const sameUsername = String(row.USERNAME).toLowerCase() === record.username.toLowerCase();
    const sameCode = String(row.STAFF_CODE || "").toUpperCase() === record.staffCode;
    const sameEmployee = Number(row.EMPLOYEE_ID) === Number(record.employeeId);
    if ((sameUsername && !sameEmployee) || (sameCode && !sameEmployee)) {
      throw new Error(`Existing user conflict for ${record.staffCode}; refusing to overwrite an unrelated account.`);
    }
  }
}

async function upsertUser(connection, user) {
  await assertNoConflicts(connection, user);
  await connection.execute(`
    MERGE INTO users target
    USING (SELECT :username username FROM dual) source
       ON (LOWER(target.username)=LOWER(source.username))
    WHEN MATCHED THEN UPDATE SET password_hash=:passwordHash, role=:role, customer_id=NULL,
      employee_id=:employeeId, staff_code=:staffCode, display_name=:displayName, is_active='Y', must_change_password='Y',
      account_locked='N', failed_login_count=0, password_changed_at=NULL, updated_at=SYSTIMESTAMP
    WHEN NOT MATCHED THEN INSERT (username, password_hash, role, customer_id, employee_id, staff_code, display_name,
      is_active, must_change_password, account_locked, failed_login_count)
      VALUES (:username, :passwordHash, :role, NULL, :employeeId, :staffCode, :displayName, 'Y', 'Y', 'N', 0)`, user);
}

async function addWelcomeNotification(connection, username) {
  await connection.execute(`INSERT INTO notifications(user_id,event_type,title,message,entity_type) SELECT user_id,'STAFF_LOGIN_CREATED','University demo account ready','Your university demonstration account requires a password change at first login.','USERS' FROM users WHERE LOWER(username)=LOWER(:username) AND NOT EXISTS (SELECT 1 FROM notifications n JOIN users u ON u.user_id=n.user_id WHERE u.username=:username AND n.event_type='STAFF_LOGIN_CREATED')`, { username });
}

async function main() {
  const { baseSecret, includeCustomer } = readOptions(process.argv.slice(2));
  if (!baseSecret || baseSecret.length < 16) throw new Error("Provide --base-secret with at least 16 characters; generated passwords are never stored in source.");
  let connection;
  try {
    await initializePool();
    connection = await getConnection();
    const records = [];
    for (const [username, staffCode, role, suffix, displayName] of staff) {
      records.push({ username, staffCode, role, suffix, displayName, employeeId: await findEmployee(connection, staffCode) });
    }
    const customerId = includeCustomer ? await findPrincipal(connection) : null;
    for (const record of records) {
      await upsertUser(connection, { ...record, passwordHash: await hashPassword(`${baseSecret}-${record.suffix}`) });
      await addWelcomeNotification(connection, record.username);
    }
    if (includeCustomer) {
      const customerRecord = { username: "customer001", customerId, displayName: "Nusrat Jahan" };
      await connection.execute(`MERGE INTO users target USING (SELECT :username username FROM dual) source ON (LOWER(target.username)=LOWER(source.username))
        WHEN MATCHED THEN UPDATE SET password_hash=:passwordHash,role='CUSTOMER',customer_id=:customerId,employee_id=NULL,staff_code=NULL,display_name=:displayName,is_active='Y',must_change_password='Y',account_locked='N',failed_login_count=0,password_changed_at=NULL,updated_at=SYSTIMESTAMP
        WHEN NOT MATCHED THEN INSERT(username,password_hash,role,customer_id,display_name,is_active,must_change_password,account_locked,failed_login_count) VALUES(:username,:passwordHash,'CUSTOMER',:customerId,:displayName,'Y','Y','N',0)`, { ...customerRecord, passwordHash: await hashPassword(`${baseSecret}-C001`) });
      await addWelcomeNotification(connection, customerRecord.username);
    }
    await connection.commit();
    console.log("University demonstration accounts only. Temporary passwords are shown once; change them at first login.");
    records.forEach((record) => console.log(`${record.username}\t${record.staffCode || "customer"}\t${baseSecret}-${record.suffix}`));
    if (includeCustomer) console.log(`customer001\tcustomer\t${baseSecret}-C001`);
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) await connection.close();
    await closePool();
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
