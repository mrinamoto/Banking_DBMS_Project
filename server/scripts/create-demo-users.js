require("dotenv").config();
const { getConnection, initializePool, closePool } = require("../config/db");
const { hashPassword } = require("../utils/passwords");

const password = process.argv[2];

async function upsertUser(connection, user) {
  await connection.execute(
    `MERGE INTO users target
     USING (SELECT :username username FROM dual) source
        ON (LOWER(target.username) = LOWER(source.username))
      WHEN MATCHED THEN UPDATE SET
        password_hash = :passwordHash,
        role = :role,
        customer_id = :customerId,
        employee_id = :employeeId,
        staff_code = :staffCode,
        is_active = 'Y',
        failed_login_count = 0
      WHEN NOT MATCHED THEN INSERT(username, password_hash, role, customer_id, employee_id, staff_code)
        VALUES(:username, :passwordHash, :role, :customerId, :employeeId, :staffCode)`,
    user
  );
}

async function main() {
  if (!password) {
    console.error("Usage: npm run seed:demo-users -- <temporary-demo-password>");
    process.exitCode = 1;
    return;
  }

  await initializePool();
  const connection = await getConnection();
  try {
    const passwordHash = await hashPassword(password);
    const people = await connection.execute(
      `SELECT
         (SELECT customer_id FROM customers WHERE national_id='NID-DEMO-001') customer_one,
         (SELECT employee_id FROM employees WHERE employee_code='M-ID-001') manager_one,
         (SELECT employee_id FROM employees WHERE employee_code='E-ID-001') employee_one
       FROM dual`
    );
    const row = people.rows[0];
    await upsertUser(connection, { username: "admin", passwordHash, role: "ADMIN", customerId: null, employeeId: null, staffCode: "A-ID-001" });
    await upsertUser(connection, { username: "manager", passwordHash, role: "MANAGER", customerId: null, employeeId: row.MANAGER_ONE, staffCode: "M-ID-001" });
    await upsertUser(connection, { username: "employee", passwordHash, role: "EMPLOYEE", customerId: null, employeeId: row.EMPLOYEE_ONE, staffCode: "E-ID-001" });
    await upsertUser(connection, { username: "customer", passwordHash, role: "CUSTOMER", customerId: row.CUSTOMER_ONE, employeeId: null, staffCode: null });
    await connection.commit();
    console.log("Demo users ready: admin, manager, employee, customer");
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.close();
    await closePool();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
