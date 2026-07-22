const { getConnection } = require("../config/db");
const { verifyPassword } = require("../utils/passwords");
const { signToken } = require("../utils/tokens");
const { requireFields, withConnection } = require("../utils/http");

async function login(req, res, next) {
  try {
    requireFields(req.body, ["username", "password"]);
    await withConnection(getConnection, async (connection) => {
      const result = await connection.execute(
        `SELECT u.user_id, u.username, u.password_hash, u.role, u.is_active,
                u.customer_id, u.employee_id, e.branch_id
           FROM users u LEFT JOIN employees e ON e.employee_id = u.employee_id
          WHERE LOWER(u.username) = LOWER(:username)`,
        { username: req.body.username.trim() }
      );
      const user = result.rows[0];
      const valid = user && user.IS_ACTIVE === "Y" && await verifyPassword(req.body.password, user.PASSWORD_HASH);
      if (!valid) return res.status(401).json({ message: "Invalid username or password." });
      await connection.execute("UPDATE users SET last_login = SYSTIMESTAMP, failed_login_count = 0 WHERE user_id = :id", { id: user.USER_ID });
      await connection.commit();
      const profile = { id: user.USER_ID, username: user.USERNAME, role: user.ROLE, customerId: user.CUSTOMER_ID, employeeId: user.EMPLOYEE_ID, branchId: user.BRANCH_ID };
      res.json({ token: signToken(profile), user: profile });
    });
  } catch (error) { next(error); }
}

function me(req, res) { res.json({ user: req.user }); }
function logout(req, res) { res.status(204).end(); }

module.exports = { login, me, logout };
