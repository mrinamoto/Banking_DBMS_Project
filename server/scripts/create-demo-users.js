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
        is_active = 'Y',
        failed_login_count = 0
      WHEN NOT MATCHED THEN INSERT(username, password_hash, role, customer_id, employee_id)
        VALUES(:username, :passwordHash, :role, :customerId, :employeeId)`,
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
         (SELECT employee_id FROM employees WHERE employee_code='EMP-001') manager_one,
         (SELECT employee_id FROM employees WHERE employee_code='EMP-002') employee_one
       FROM dual`
    );
    const row = people.rows[0];
    await upsertUser(connection, { username: "admin", passwordHash, role: "ADMIN", customerId: null, employeeId: null });
    await upsertUser(connection, { username: "manager", passwordHash, role: "MANAGER", customerId: null, employeeId: row.MANAGER_ONE });
    await upsertUser(connection, { username: "employee", passwordHash, role: "EMPLOYEE", customerId: null, employeeId: row.EMPLOYEE_ONE });
    await upsertUser(connection, { username: "customer", passwordHash, role: "CUSTOMER", customerId: row.CUSTOMER_ONE, employeeId: null });
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
