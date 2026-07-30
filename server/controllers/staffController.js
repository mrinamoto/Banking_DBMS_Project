const oracledb = require("oracledb");
const { getConnection } = require("../config/db");
const { hashPassword } = require("../utils/passwords");
const { requireFields, pageOptions, withConnection } = require("../utils/http");
const { assertBranchId, setClientIdentifier } = require("../utils/authorization");

const staffRoles = new Set(["MANAGER", "EMPLOYEE"]);

function badRequest(message) { const error = new Error(message); error.status = 400; return error; }
function notFound(message) { const error = new Error(message); error.status = 404; return error; }
function normalizeUsername(value) { return String(value || "").trim().toLowerCase(); }
function assertStaffRole(actor, role) {
  if (!staffRoles.has(role)) throw badRequest("Staff login role must be MANAGER or EMPLOYEE.");
  if (actor.role === "MANAGER" && role !== "EMPLOYEE") throw Object.assign(new Error("Managers may create only Employee logins."), { status: 403 });
  if (actor.role !== "ADMIN" && actor.role !== "MANAGER") throw Object.assign(new Error("You cannot manage staff logins."), { status: 403 });
}

async function listUsers(req, res, next) {
  try {
    await withConnection(getConnection, async (connection) => {
      const { page, pageSize, offset } = pageOptions(req.query);
      const binds = { search: `%${String(req.query.search || "").trim().toLowerCase()}%`, role: req.query.role || null, active: req.query.active || null, offset, pageSize, branchId: req.user.role === "MANAGER" ? req.user.branchId : (req.query.branchId ? Number(req.query.branchId) : null) };
      if (binds.role && !["ADMIN", "MANAGER", "EMPLOYEE", "CUSTOMER"].includes(binds.role)) throw badRequest("Invalid role filter.");
      if (binds.active && !["Y", "N"].includes(binds.active)) throw badRequest("Invalid active filter.");
      const result = await connection.execute(
        `SELECT u.user_id,u.username,u.role,u.is_active,u.account_locked,u.must_change_password,
                u.failed_login_count,u.last_login,u.created_at,u.updated_at,
                e.employee_id,e.employee_code,e.first_name||' '||e.last_name employee_name,
                e.job_title,e.branch_id,b.branch_name,
                c.customer_id,c.first_name||' '||c.last_name customer_name,
                COUNT(*) OVER() total_count
           FROM users u
           LEFT JOIN employees e ON e.employee_id=u.employee_id
           LEFT JOIN branches b ON b.branch_id=e.branch_id
           LEFT JOIN customers c ON c.customer_id=u.customer_id
          WHERE (LOWER(u.username||' '||NVL(e.first_name||' '||e.last_name,'')||' '||NVL(e.employee_code,'')||' '||NVL(c.first_name||' '||c.last_name,'')) LIKE :search)
            AND (:role IS NULL OR u.role=:role)
            AND (:active IS NULL OR u.is_active=:active)
            AND (:branchId IS NULL OR e.branch_id=:branchId OR EXISTS (SELECT 1 FROM accounts a WHERE a.customer_id=u.customer_id AND a.branch_id=:branchId))
          ORDER BY u.created_at DESC
          OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`, binds
      );
      res.json({ items: result.rows, page, pageSize, total: result.rows[0]?.TOTAL_COUNT || 0 });
    });
  } catch (error) { next(error); }
}

async function listEligibleEmployees(req, res, next) {
  try {
    await withConnection(getConnection, async (connection) => {
      const branchId = req.user.role === "MANAGER" ? req.user.branchId : null;
      const result = await connection.execute(
        `SELECT e.employee_id,e.employee_code,e.first_name||' '||e.last_name employee_name,
                e.job_title,e.branch_id,b.branch_name
           FROM employees e JOIN branches b ON b.branch_id=e.branch_id
          WHERE e.status='ACTIVE' AND (:branchId IS NULL OR e.branch_id=:branchId)
            AND NOT EXISTS (SELECT 1 FROM users u WHERE u.employee_id=e.employee_id)
          ORDER BY e.first_name,e.last_name`, { branchId }
      );
      res.json(result.rows);
    });
  } catch (error) { next(error); }
}

async function createStaffUser(req, res, next) {
  let connection;
  try {
    requireFields(req.body, ["employeeId", "role", "username", "temporaryPassword", "confirmTemporaryPassword"]);
    assertStaffRole(req.user, req.body.role);
    if (req.body.temporaryPassword !== req.body.confirmTemporaryPassword) throw badRequest("Temporary passwords do not match.");
    const username = normalizeUsername(req.body.username);
    if (!/^[a-z0-9._-]{4,50}$/.test(username)) throw badRequest("Username must be 4-50 characters using letters, numbers, dots, underscores, or hyphens.");
    connection = await getConnection();
    const employeeResult = await connection.execute(
      `SELECT e.employee_id,e.branch_id,e.status,
              CASE WHEN EXISTS (SELECT 1 FROM users u WHERE u.employee_id=e.employee_id) THEN 1 ELSE 0 END has_user
         FROM employees e WHERE e.employee_id=:employeeId`, { employeeId: Number(req.body.employeeId) }
    );
    const employee = employeeResult.rows[0];
    if (!employee) throw notFound("Employee not found.");
    if (employee.STATUS !== "ACTIVE") throw badRequest("Only active employees can receive a login.");
    assertBranchId(req.user, employee.BRANCH_ID);
    if (employee.HAS_USER) throw badRequest("This employee already has a login account.");
    const existing = await connection.execute("SELECT 1 FROM users WHERE LOWER(username)=:username", { username });
    if (existing.rows.length) throw badRequest("That username is already in use.");
    const passwordHash = await hashPassword(req.body.temporaryPassword);
    await setClientIdentifier(connection, req.user);
    const result = await connection.execute(
      `INSERT INTO users(employee_id,username,password_hash,role,is_active,must_change_password,password_changed_at,updated_at)
       VALUES(:employeeId,:username,:passwordHash,:role,:isActive,:mustChange,NULL,SYSTIMESTAMP)
       RETURNING user_id INTO :userId`,
      { employeeId: employee.EMPLOYEE_ID, username, passwordHash, role: req.body.role, isActive: req.body.isActive === false ? "N" : "Y", mustChange: req.body.forcePasswordChange === false ? "N" : "Y", userId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } }
    );
    await connection.execute(
      `INSERT INTO audit_log(table_name,record_id,action_name,action_by,new_summary)
       VALUES('USERS',:id,'CREATE_STAFF_LOGIN',:actor,:summary)`,
      { id: result.outBinds.userId[0], actor: req.user.username, summary: `employee_id=${employee.EMPLOYEE_ID};role=${req.body.role}` }
    );
    await connection.commit();
    res.status(201).json({ id: result.outBinds.userId[0], message: "Staff login created." });
  } catch (error) { if (connection) await connection.rollback(); next(error); }
  finally { if (connection) await connection.close(); }
}

async function getUserDetails(req, res, next) {
  try {
    await withConnection(getConnection, async (connection) => {
      const result = await connection.execute(
        `SELECT u.user_id,u.username,u.role,u.is_active,u.account_locked,u.locked_at,u.must_change_password,
                u.failed_login_count,u.last_login,u.created_at,u.updated_at,
                e.employee_id,e.employee_code,e.first_name||' '||e.last_name employee_name,e.job_title,b.branch_name,
                c.customer_id,c.first_name||' '||c.last_name customer_name
           FROM users u LEFT JOIN employees e ON e.employee_id=u.employee_id LEFT JOIN branches b ON b.branch_id=e.branch_id
           LEFT JOIN customers c ON c.customer_id=u.customer_id WHERE u.user_id=:id`, { id: Number(req.params.id) }
      );
      const row = result.rows[0];
      if (!row) throw notFound("User not found.");
      if (req.user.role === "MANAGER" && Number(row.BRANCH_ID) !== Number(req.user.branchId)) throw Object.assign(new Error("You cannot view another branch."), { status: 403 });
      res.json(row);
    });
  } catch (error) { next(error); }
}

async function setUserStatus(req, res, next) {
  await mutateUser(req, res, next, "status", async (connection, target) => {
    const status = req.body.status;
    if (!["Y", "N"].includes(status)) throw badRequest("Status must be Y or N.");
    if (target.ROLE === "ADMIN" && status === "N") {
      const active = await connection.execute("SELECT COUNT(*) count FROM users WHERE role='ADMIN' AND is_active='Y'");
      if (Number(active.rows[0].COUNT) <= 1) throw badRequest("The final active Admin cannot be deactivated.");
    }
    await connection.execute("UPDATE users SET is_active=:status,updated_at=SYSTIMESTAMP WHERE user_id=:id", { status, id: target.USER_ID });
    return `status=${status}`;
  });
}

async function unlockUser(req, res, next) {
  await mutateUser(req, res, next, "unlock", async (connection, target) => {
    await connection.execute("UPDATE users SET account_locked='N',locked_at=NULL,failed_login_count=0,updated_at=SYSTIMESTAMP WHERE user_id=:id", { id: target.USER_ID });
    return "account_locked=N;failed_login_count=0";
  });
}

async function resetPassword(req, res, next) {
  await mutateUser(req, res, next, "reset", async (connection, target) => {
    requireFields(req.body, ["temporaryPassword", "confirmTemporaryPassword"]);
    if (req.body.temporaryPassword !== req.body.confirmTemporaryPassword) throw badRequest("Temporary passwords do not match.");
    const passwordHash = await hashPassword(req.body.temporaryPassword);
    await connection.execute("UPDATE users SET password_hash=:passwordHash,must_change_password='Y',password_changed_at=NULL,account_locked='N',locked_at=NULL,failed_login_count=0,updated_at=SYSTIMESTAMP WHERE user_id=:id", { passwordHash, id: target.USER_ID });
    return "password_reset=true";
  });
}

async function changeRole(req, res, next) {
  await mutateUser(req, res, next, "role", async (connection, target) => {
    if (req.user.role !== "ADMIN") throw Object.assign(new Error("Only Admins can change staff roles."), { status: 403 });
    assertStaffRole(req.user, req.body.role);
    if (target.ROLE === "ADMIN") throw badRequest("Admin role changes are not permitted here.");
    await connection.execute("UPDATE users SET role=:role,updated_at=SYSTIMESTAMP WHERE user_id=:id", { role: req.body.role, id: target.USER_ID });
    return `role=${req.body.role}`;
  });
}

async function mutateUser(req, res, next, action, operation) {
  let connection;
  try {
    if (!['ADMIN', 'MANAGER'].includes(req.user.role)) throw Object.assign(new Error("You cannot manage staff logins."), { status: 403 });
    connection = await getConnection();
    const result = await connection.execute(
      `SELECT u.user_id,u.role,e.branch_id FROM users u LEFT JOIN employees e ON e.employee_id=u.employee_id WHERE u.user_id=:id`, { id: Number(req.params.id) }
    );
    const target = result.rows[0];
    if (!target) throw notFound("User not found.");
    if (req.user.role === "MANAGER") {
      if (target.ROLE !== "EMPLOYEE" || Number(target.BRANCH_ID) !== Number(req.user.branchId)) throw Object.assign(new Error("Managers may manage only employees in their own branch."), { status: 403 });
    }
    await setClientIdentifier(connection, req.user);
    const summary = await operation(connection, target);
    await connection.execute(`INSERT INTO audit_log(table_name,record_id,action_name,action_by,new_summary) VALUES('USERS',:id,:action,:actor,:summary)`, { id: target.USER_ID, action: `STAFF_${action.toUpperCase()}`, actor: req.user.username, summary });
    await connection.commit();
    res.json({ message: `Staff user ${action} completed.` });
  } catch (error) { if (connection) await connection.rollback(); next(error); }
  finally { if (connection) await connection.close(); }
}

module.exports = { listUsers, listEligibleEmployees, createStaffUser, getUserDetails, setUserStatus, resetPassword, unlockUser, changeRole, assertStaffRole };
