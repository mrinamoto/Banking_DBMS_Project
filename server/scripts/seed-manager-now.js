const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.join(__dirname, "..", ".env"),
});

const {
  initializePool,
  getConnection,
  closePool,
} = require("../config/db");

const { hashPassword } = require("../utils/passwords");

const BASE_SECRET = "BankProjectSecure#2026";

async function main() {
  let connection;

  try {
    await initializePool();
    connection = await getConnection();

    const schemaResult = await connection.execute(
      "SELECT USER AS SCHEMA_NAME FROM dual"
    );

    console.log(
      "CONNECTED_SCHEMA:",
      schemaResult.rows[0].SCHEMA_NAME
    );

    const employeeResult = await connection.execute(
      `SELECT employee_id,
              employee_code,
              first_name,
              last_name,
              status
         FROM employees
        WHERE UPPER(TRIM(employee_code)) = 'M-ID-001'
          AND status = 'ACTIVE'`
    );

    const employee = employeeResult.rows[0];

    if (!employee) {
      throw new Error(
        "Active employee M-ID-001 is missing in the database connected through server/.env."
      );
    }

    const passwordHash = await hashPassword(
      `${BASE_SECRET}-M001`
    );

    await connection.execute(
      `MERGE INTO users target
       USING (
         SELECT :employeeId AS employee_id
         FROM dual
       ) source
       ON (target.employee_id = source.employee_id)

       WHEN MATCHED THEN
         UPDATE SET
           target.username = 'mayen.majumder001',
           target.staff_code = 'M-ID-001',
           target.display_name = 'Mayen Majumder',
           target.password_hash = :passwordHash,
           target.role = 'MANAGER',
           target.customer_id = NULL,
           target.is_active = 'Y',
           target.account_locked = 'N',
           target.failed_login_count = 0,
           target.must_change_password = 'Y',
           target.locked_at = NULL,
           target.password_changed_at = NULL,
           target.updated_at = SYSTIMESTAMP

       WHEN NOT MATCHED THEN
         INSERT (
           username,
           staff_code,
           display_name,
           password_hash,
           role,
           employee_id,
           customer_id,
           is_active,
           account_locked,
           failed_login_count,
           must_change_password
         )
         VALUES (
           'mayen.majumder001',
           'M-ID-001',
           'Mayen Majumder',
           :passwordHash,
           'MANAGER',
           :employeeId,
           NULL,
           'Y',
           'N',
           0,
           'Y'
         )`,
      {
        employeeId: employee.EMPLOYEE_ID,
        passwordHash,
      }
    );

    await connection.commit();

    const verifyResult = await connection.execute(
      `SELECT username,
              staff_code,
              role,
              employee_id,
              is_active,
              account_locked,
              failed_login_count,
              must_change_password
         FROM users
        WHERE employee_id = :employeeId`,
      {
        employeeId: employee.EMPLOYEE_ID,
      }
    );

    console.table(verifyResult.rows);

    console.log("");
    console.log("MANAGER LOGIN CREATED");
    console.log("Username: mayen.majumder001");
    console.log("Staff ID: M-ID-001");
    console.log(
      "Password: BankProjectSecure#2026-M001"
    );
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("MANAGER SEED FAILED:");
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.close();
    }

    await closePool();
  }
}

main();
