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

const staff = [
  {
    username: "admin.mrinmoy001",
    staffCode: "A-ID-001",
    role: "ADMIN",
    suffix: "A001",
    firstName: "Mohammad",
    lastName: "Mrinmoy",
    jobTitle: "System Administrator",
    branchCode: "HO-001",
    salary: 95000,
  },
  {
    username: "admin.monira002",
    staffCode: "A-ID-002",
    role: "ADMIN",
    suffix: "A002",
    firstName: "Sirajum",
    lastName: "Monira",
    jobTitle: "System Administrator",
    branchCode: "HO-001",
    salary: 93000,
  },
  {
    username: "admin.ashik003",
    staffCode: "A-ID-003",
    role: "ADMIN",
    suffix: "A003",
    firstName: "Ashik",
    lastName: "Uz-zaman",
    jobTitle: "System Administrator",
    branchCode: "HO-001",
    salary: 92000,
  },
  {
    username: "admin.asif004",
    staffCode: "A-ID-004",
    role: "ADMIN",
    suffix: "A004",
    firstName: "Ikhteir",
    lastName: "Asif",
    jobTitle: "System Administrator",
    branchCode: "HO-001",
    salary: 91000,
  },
  {
    username: "mayen.majumder001",
    staffCode: "M-ID-001",
    role: "MANAGER",
    suffix: "M001",
    firstName: "Mayen",
    lastName: "Majumder",
    jobTitle: "Project Supervisor / Branch Manager",
    branchCode: "DHK-001",
    salary: 90000,
  },
  {
    username: "mashrur.hasan001",
    staffCode: "E-ID-001",
    role: "EMPLOYEE",
    suffix: "E001",
    firstName: "Mashrur",
    lastName: "Hasan",
    jobTitle: "Senior Banking Officer",
    branchCode: "DHK-001",
    salary: 55000,
  },
  {
    username: "risha.khan002",
    staffCode: "E-ID-002",
    role: "EMPLOYEE",
    suffix: "E002",
    firstName: "Risha",
    lastName: "Khan",
    jobTitle: "Customer Service Officer",
    branchCode: "UTT-001",
    salary: 50000,
  },
  {
    username: "samin.hasan003",
    staffCode: "E-ID-003",
    role: "EMPLOYEE",
    suffix: "E003",
    firstName: "Samin",
    lastName: "Hasan",
    jobTitle: "Credit Officer",
    branchCode: "CTG-001",
    salary: 52000,
  },
  {
    username: "abrar.karib004",
    staffCode: "E-ID-004",
    role: "EMPLOYEE",
    suffix: "E004",
    firstName: "Abrar",
    lastName: "Karib",
    jobTitle: "Service Officer",
    branchCode: "CHP-001",
    salary: 49000,
  },
  {
    username: "rakib.hasan005",
    staffCode: "E-ID-005",
    role: "EMPLOYEE",
    suffix: "E005",
    firstName: "Rakib",
    lastName: "Hasan",
    jobTitle: "Operations Officer",
    branchCode: "DHK-001",
    salary: 53000,
  },
  {
    username: "prapto.sorkar006",
    staffCode: "E-ID-006",
    role: "EMPLOYEE",
    suffix: "E006",
    firstName: "Prapto",
    lastName: "Sorkar",
    jobTitle: "Account Officer",
    branchCode: "UTT-001",
    salary: 51000,
  },
  {
    username: "sayba.tasnim007",
    staffCode: "E-ID-007",
    role: "EMPLOYEE",
    suffix: "E007",
    firstName: "Sayba",
    lastName: "Tasnim",
    jobTitle: "Loan Officer",
    branchCode: "CTG-001",
    salary: 54000,
  },
  {
    username: "tasnia.suborno008",
    staffCode: "E-ID-008",
    role: "EMPLOYEE",
    suffix: "E008",
    firstName: "Tasnia",
    lastName: "Suborno",
    jobTitle: "Customer Support Officer",
    branchCode: "CHP-001",
    salary: 50000,
  },
];

async function resolveBranchId(connection, preferredBranchCode) {
  const result = await connection.execute(
    `SELECT branch_id
       FROM (
         SELECT branch_id
           FROM branches
          WHERE status = 'ACTIVE'
          ORDER BY
            CASE
              WHEN branch_code = :branchCode THEN 0
              ELSE 1
            END,
            branch_id
       )
      WHERE ROWNUM = 1`,
    {
      branchCode: preferredBranchCode,
    }
  );

  if (!result.rows[0]) {
    throw new Error("No ACTIVE branch exists.");
  }

  return result.rows[0].BRANCH_ID;
}

async function upsertEmployee(connection, record) {
  const branchId = await resolveBranchId(
    connection,
    record.branchCode
  );

  await connection.execute(
    `MERGE INTO employees target
     USING (
       SELECT :employeeCode AS employee_code
       FROM dual
     ) source
     ON (
       UPPER(TRIM(target.employee_code))
       = UPPER(TRIM(source.employee_code))
     )

     WHEN MATCHED THEN
       UPDATE SET
         target.branch_id = :branchId,
         target.first_name = :firstName,
         target.last_name = :lastName,
         target.job_title = :jobTitle,
         target.email = :email,
         target.salary = :salary,
         target.status = 'ACTIVE'

     WHEN NOT MATCHED THEN
       INSERT (
         branch_id,
         employee_code,
         first_name,
         last_name,
         national_id,
         job_title,
         email,
         phone,
         salary,
         hire_date,
         status
       )
       VALUES (
         :branchId,
         :employeeCode,
         :firstName,
         :lastName,
         :nationalId,
         :jobTitle,
         :email,
         :phone,
         :salary,
         TRUNC(SYSDATE),
         'ACTIVE'
       )`,
    {
      employeeCode: record.staffCode,
      branchId,
      firstName: record.firstName,
      lastName: record.lastName,
      nationalId: `DEMO-EMP-${record.suffix}`,
      jobTitle: record.jobTitle,
      email: `${record.username}@example.test`,
      phone: `DEMO-${record.suffix}`,
      salary: record.salary,
    }
  );

  const result = await connection.execute(
    `SELECT employee_id
       FROM employees
      WHERE UPPER(TRIM(employee_code))
          = UPPER(TRIM(:staffCode))`,
    {
      staffCode: record.staffCode,
    }
  );

  if (!result.rows[0]) {
    throw new Error(
      `Employee creation failed for ${record.staffCode}`
    );
  }

  return result.rows[0].EMPLOYEE_ID;
}

async function upsertUser(connection, record, employeeId) {
  const password = `${BASE_SECRET}-${record.suffix}`;
  const passwordHash = await hashPassword(password);
  const displayName =
    `${record.firstName} ${record.lastName}`.trim();

  const existing = await connection.execute(
    `SELECT user_id
       FROM users
      WHERE employee_id = :employeeId
         OR LOWER(username) = LOWER(:username)
         OR UPPER(staff_code) = UPPER(:staffCode)`,
    {
      employeeId,
      username: record.username,
      staffCode: record.staffCode,
    }
  );

  const userIds = [
    ...new Set(
      existing.rows.map((row) => Number(row.USER_ID))
    ),
  ];

  if (userIds.length > 1) {
    throw new Error(
      `Multiple conflicting users exist for ${record.staffCode}`
    );
  }

  if (userIds.length === 1) {
    await connection.execute(
      `UPDATE users
          SET username = :username,
              staff_code = :staffCode,
              display_name = :displayName,
              password_hash = :passwordHash,
              role = :role,
              employee_id = :employeeId,
              customer_id = NULL,
              is_active = 'Y',
              account_locked = 'N',
              failed_login_count = 0,
              must_change_password = 'Y',
              locked_at = NULL,
              password_changed_at = NULL,
              updated_at = SYSTIMESTAMP
        WHERE user_id = :userId`,
      {
        username: record.username,
        staffCode: record.staffCode,
        displayName,
        passwordHash,
        role: record.role,
        employeeId,
        userId: userIds[0],
      }
    );
  } else {
    await connection.execute(
      `INSERT INTO users (
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
         :username,
         :staffCode,
         :displayName,
         :passwordHash,
         :role,
         :employeeId,
         NULL,
         'Y',
         'N',
         0,
         'Y'
       )`,
      {
        username: record.username,
        staffCode: record.staffCode,
        displayName,
        passwordHash,
        role: record.role,
        employeeId,
      }
    );
  }

  return password;
}

async function main() {
  let connection;

  try {
    await initializePool();
    connection = await getConnection();

    const schemaResult = await connection.execute(
      "SELECT USER AS schema_name FROM dual"
    );

    console.log(
      "CONNECTED_SCHEMA:",
      schemaResult.rows[0].SCHEMA_NAME
    );

    const credentials = [];

    for (const record of staff) {
      const employeeId = await upsertEmployee(
        connection,
        record
      );

      const password = await upsertUser(
        connection,
        record,
        employeeId
      );

      credentials.push({
        role: record.role,
        username: record.username,
        staffId: record.staffCode,
        password,
      });
    }

    await connection.commit();

    console.log("");
    console.log("ALL STAFF LOGIN ACCOUNTS CREATED");
    console.table(credentials);
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("STAFF SEED FAILED:");
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
