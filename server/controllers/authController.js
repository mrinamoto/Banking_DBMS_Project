const { getConnection } = require("../config/db");
const oracledb = require("oracledb");
const { hashPassword, verifyPassword } = require("../utils/passwords");
const { signToken } = require("../utils/tokens");
const { requireFields, withConnection } = require("../utils/http");

function normalizeUsername(username) {
  return String(username || "").trim().toLowerCase();
}

function profileFromRow(user) {
  return {
    id: user.USER_ID,
    username: user.USERNAME,
    role: user.ROLE,
    customerId: user.CUSTOMER_ID,
    employeeId: user.EMPLOYEE_ID,
    branchId: user.BRANCH_ID,
    mustChangePassword: user.MUST_CHANGE_PASSWORD === "Y",
  };
}

async function login(req, res, next) {
  try {
    requireFields(req.body, ["username", "password"]);
    await withConnection(getConnection, async (connection) => {
      const result = await connection.execute(
        `SELECT u.user_id, u.username, u.password_hash, u.role, u.is_active,
                u.account_locked, u.must_change_password, u.customer_id, u.employee_id, e.branch_id
           FROM users u LEFT JOIN employees e ON e.employee_id = u.employee_id
          WHERE LOWER(u.username) = LOWER(:username)`,
        { username: normalizeUsername(req.body.username) }
      );
      const user = result.rows[0];
      const validPassword = user && await verifyPassword(req.body.password, user.PASSWORD_HASH);
      if (!user || user.IS_ACTIVE !== "Y" || user.ACCOUNT_LOCKED === "Y" || !validPassword) {
        if (user && user.IS_ACTIVE === "Y" && !validPassword) {
          await connection.execute(
            "UPDATE users SET failed_login_count = failed_login_count + 1, account_locked = CASE WHEN failed_login_count + 1 >= 5 THEN 'Y' ELSE account_locked END, locked_at = CASE WHEN failed_login_count + 1 >= 5 THEN SYSTIMESTAMP ELSE locked_at END, updated_at = SYSTIMESTAMP WHERE user_id = :id",
            { id: user.USER_ID }
          );
          await connection.execute(
            `INSERT INTO login_history(user_id, attempted_username, success_flag, event_type, failure_reason)
             VALUES(:userId, :username, 'N', 'LOGIN', 'INVALID_PASSWORD')`,
            { userId: user.USER_ID, username: normalizeUsername(req.body.username) }
          );
          await connection.commit();
        } else if (user) {
          await connection.execute(
            `INSERT INTO login_history(user_id, attempted_username, success_flag, event_type, failure_reason)
             VALUES(:userId, :username, 'N', 'LOGIN', :reason)`,
            { userId: user.USER_ID, username: normalizeUsername(req.body.username), reason: user.ACCOUNT_LOCKED === "Y" ? "ACCOUNT_LOCKED" : "INACTIVE" }
          );
          await connection.commit();
        }
        return res.status(401).json({ message: "Invalid username or password." });
      }
      await connection.execute("UPDATE users SET last_login = SYSTIMESTAMP, failed_login_count = 0 WHERE user_id = :id", { id: user.USER_ID });
      await connection.execute(
        `INSERT INTO login_history(user_id, attempted_username, success_flag, event_type)
         VALUES(:userId, :username, 'Y', 'LOGIN')`,
        { userId: user.USER_ID, username: normalizeUsername(req.body.username) }
      );
      await connection.commit();
      const profile = profileFromRow(user);
      res.json({ token: signToken(profile), user: profile });
    });
  } catch (error) { next(error); }
}

async function register(req, res, next) {
  let connection;
  try {
    if (req.body.role && req.body.role !== "CUSTOMER") {
      const roleError = new Error("Public registration can create Customer accounts only.");
      roleError.status = 400;
      throw roleError;
    }
    requireFields(req.body, [
      "firstName",
      "lastName",
      "dateOfBirth",
      "phone",
      "nationalId",
      "address",
      "username",
      "password",
    ]);

    const username = normalizeUsername(req.body.username);
    if (!/^[a-z0-9._-]{4,50}$/.test(username)) {
      const error = new Error("Username must be 4-50 characters using letters, numbers, dots, underscores, or hyphens.");
      error.status = 400;
      throw error;
    }
    if (req.body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(req.body.email).trim())) {
      const error = new Error("Enter a valid email address.");
      error.status = 400;
      throw error;
    }
    if (req.body.annualIncome !== undefined && req.body.annualIncome !== "" && (!Number.isFinite(Number(req.body.annualIncome)) || Number(req.body.annualIncome) < 0)) {
      const error = new Error("Annual income must be zero or a positive number.");
      error.status = 400;
      throw error;
    }

    const passwordHash = await hashPassword(req.body.password);
    connection = await getConnection();

    const existing = await connection.execute(
      `SELECT 1
         FROM users
        WHERE LOWER(username) = :username
        UNION ALL
       SELECT 1
         FROM customers
        WHERE phone = :phone
           OR national_id = :nationalId
           OR (:email IS NOT NULL AND LOWER(email) = LOWER(:email))`,
      {
        username,
        phone: req.body.phone.trim(),
        nationalId: req.body.nationalId.trim(),
        email: req.body.email ? req.body.email.trim() : null,
      }
    );

    if (existing.rows.length) {
      const error = new Error("An account already exists with this username, phone, email, or national ID.");
      error.status = 400;
      throw error;
    }

    const customerResult = await connection.execute(
      `INSERT INTO customers(
          first_name, last_name, date_of_birth, gender, phone, email,
          national_id, address, occupation, annual_income
        )
        VALUES(
          :firstName, :lastName, TO_DATE(:dateOfBirth,'YYYY-MM-DD'), :gender,
          :phone, :email, :nationalId, :address, :occupation, :annualIncome
        )
        RETURNING customer_id INTO :customerId`,
      {
        firstName: req.body.firstName.trim(),
        lastName: req.body.lastName.trim(),
        dateOfBirth: req.body.dateOfBirth,
        gender: req.body.gender || null,
        phone: req.body.phone.trim(),
        email: req.body.email ? req.body.email.trim() : null,
        nationalId: req.body.nationalId.trim(),
        address: req.body.address.trim(),
        occupation: req.body.occupation ? req.body.occupation.trim() : null,
        annualIncome: Number(req.body.annualIncome || 0),
        customerId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );

    const customerId = customerResult.outBinds.customerId[0];
    const userResult = await connection.execute(
      `INSERT INTO users(customer_id, username, password_hash, role)
       VALUES(:customerId, :username, :passwordHash, 'CUSTOMER')
       RETURNING user_id INTO :userId`,
      {
        customerId,
        username,
        passwordHash,
        userId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );

    await connection.execute(
      `INSERT INTO customer_kyc(customer_id,status)
       VALUES(:customerId,'PENDING')`,
      { customerId }
    );

    await connection.commit();

    const profile = {
      id: userResult.outBinds.userId[0],
      username,
      role: "CUSTOMER",
      customerId,
      employeeId: null,
      branchId: null,
    };
    res.status(201).json({ token: signToken(profile), user: profile, message: "Customer account created." });
  } catch (error) {
    if (connection) await connection.rollback();
    if (Number(error.errorNum) === 1) {
      error.message = "An account already exists with this username, phone, email, or national ID.";
      error.status = 400;
    }
    next(error);
  } finally {
    if (connection) await connection.close();
  }
}

function me(req, res) { res.json({ user: req.user }); }
function logout(req, res) { res.status(204).end(); }

module.exports = { login, register, me, logout };
