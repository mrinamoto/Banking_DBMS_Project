const { getConnection } = require("../config/db");
const { pageOptions, withConnection } = require("../utils/http");

// SQL and columns are deliberately fixed. User input is never interpolated into SQL.
const resources = {
  branches: { label: "Branches", roles: ["ADMIN", "MANAGER"], columns: ["BRANCH_ID", "BRANCH_CODE", "BRANCH_NAME", "CITY", "STATUS"], search: ["BRANCH_CODE", "BRANCH_NAME", "CITY"], sort: ["BRANCH_ID", "BRANCH_NAME", "CITY", "STATUS"], from: "branches", scope: "branch_id=:branchId" },
  customers: { label: "Customers", roles: ["ADMIN", "MANAGER"], columns: ["CUSTOMER_ID", "FIRST_NAME", "LAST_NAME", "PHONE", "EMAIL", "STATUS", "CREATED_AT"], search: ["FIRST_NAME", "LAST_NAME", "PHONE", "EMAIL"], sort: ["CUSTOMER_ID", "FIRST_NAME", "LAST_NAME", "CREATED_AT", "STATUS"], from: "customers c", scope: "EXISTS (SELECT 1 FROM accounts a WHERE a.customer_id=c.customer_id AND a.branch_id=:branchId)" },
  employees: { label: "Employees", roles: ["ADMIN", "MANAGER"], columns: ["EMPLOYEE_ID", "EMPLOYEE_CODE", "EMPLOYEE_NAME", "JOB_TITLE", "BRANCH_NAME", "STATUS"], search: ["e.EMPLOYEE_CODE", "e.FIRST_NAME", "e.LAST_NAME", "e.JOB_TITLE"], sort: ["EMPLOYEE_ID", "EMPLOYEE_CODE", "EMPLOYEE_NAME", "BRANCH_NAME", "STATUS"], from: "employees e JOIN branches b ON b.branch_id=e.branch_id", select: "e.employee_id,e.employee_code,e.first_name||' '||e.last_name employee_name,e.job_title,b.branch_name,e.status", scope: "e.branch_id=:branchId" },
  users: { label: "Users", roles: ["ADMIN", "MANAGER"], columns: ["USER_ID", "USERNAME", "ROLE", "IS_ACTIVE", "ACCOUNT_LOCKED", "FAILED_LOGIN_COUNT", "LAST_LOGIN", "BRANCH_NAME"], search: ["u.USERNAME", "e.EMPLOYEE_CODE", "e.FIRST_NAME", "e.LAST_NAME"], sort: ["USER_ID", "USERNAME", "ROLE", "IS_ACTIVE", "LAST_LOGIN"], from: "users u LEFT JOIN employees e ON e.employee_id=u.employee_id LEFT JOIN branches b ON b.branch_id=e.branch_id", select: "u.user_id,u.username,u.role,u.is_active,u.account_locked,u.failed_login_count,u.last_login,b.branch_name", scope: "(e.branch_id=:branchId OR EXISTS (SELECT 1 FROM accounts a WHERE a.customer_id=u.customer_id AND a.branch_id=:branchId))" },
  accounts: { label: "Accounts", roles: ["ADMIN", "MANAGER"], columns: ["ACCOUNT_ID", "ACCOUNT_NUMBER", "CUSTOMER_NAME", "BRANCH_NAME", "BALANCE", "STATUS"], search: ["a.ACCOUNT_NUMBER", "c.FIRST_NAME", "c.LAST_NAME"], sort: ["ACCOUNT_ID", "ACCOUNT_NUMBER", "CUSTOMER_NAME", "BALANCE", "STATUS"], from: "accounts a JOIN customers c ON c.customer_id=a.customer_id JOIN branches b ON b.branch_id=a.branch_id", select: "a.account_id,a.account_number,c.first_name||' '||c.last_name customer_name,b.branch_name,a.balance,a.status", scope: "a.branch_id=:branchId" },
  "account-types": { label: "Account Types", roles: ["ADMIN", "MANAGER"], columns: ["ACCOUNT_TYPE_ID", "TYPE_NAME", "MIN_BALANCE", "ANNUAL_INTEREST_RATE", "STATUS"], search: ["TYPE_NAME", "DESCRIPTION"], sort: ["ACCOUNT_TYPE_ID", "TYPE_NAME", "MIN_BALANCE", "STATUS"], from: "account_types", scope: "1=1" },
  transactions: { label: "Transactions", roles: ["ADMIN", "MANAGER"], columns: ["TRANSACTION_ID", "REFERENCE_NO", "TRANSACTION_TYPE", "ACCOUNT_NUMBER", "AMOUNT", "STATUS", "TRANSACTION_DATE"], search: ["t.REFERENCE_NO", "t.TRANSACTION_TYPE", "a.ACCOUNT_NUMBER"], sort: ["TRANSACTION_ID", "REFERENCE_NO", "AMOUNT", "TRANSACTION_DATE", "STATUS"], from: "transactions t JOIN accounts a ON a.account_id=t.account_id", select: "t.transaction_id,t.reference_no,t.transaction_type,a.account_number,t.amount,t.status,t.transaction_date", scope: "a.branch_id=:branchId" },
  "fund-transfers": { label: "Fund Transfers", roles: ["ADMIN", "MANAGER"], columns: ["TRANSFER_ID", "TRANSFER_REFERENCE", "FROM_ACCOUNT", "TO_ACCOUNT", "AMOUNT", "TRANSFER_DATE"], search: ["f.TRANSFER_REFERENCE", "fa.ACCOUNT_NUMBER", "ta.ACCOUNT_NUMBER"], sort: ["TRANSFER_ID", "TRANSFER_REFERENCE", "AMOUNT", "TRANSFER_DATE"], from: "fund_transfers f JOIN accounts fa ON fa.account_id=f.from_account_id JOIN accounts ta ON ta.account_id=f.to_account_id", select: "f.transfer_id,f.transfer_reference,fa.account_number from_account,ta.account_number to_account,f.amount,f.transfer_date", scope: "fa.branch_id=:branchId" },
  loans: { label: "Loans", roles: ["ADMIN", "MANAGER"], columns: ["LOAN_ID", "LOAN_NUMBER", "CUSTOMER_NAME", "REQUESTED_AMOUNT", "OUTSTANDING_BALANCE", "STATUS", "APPLICATION_DATE"], search: ["l.LOAN_NUMBER", "c.FIRST_NAME", "c.LAST_NAME", "l.STATUS"], sort: ["LOAN_ID", "LOAN_NUMBER", "REQUESTED_AMOUNT", "STATUS", "APPLICATION_DATE"], from: "loans l JOIN customers c ON c.customer_id=l.customer_id JOIN accounts a ON a.account_id=l.disbursement_account_id", select: "l.loan_id,l.loan_number,c.first_name||' '||c.last_name customer_name,l.requested_amount,l.outstanding_balance,l.status,l.application_date", scope: "a.branch_id=:branchId" },
  "loan-types": { label: "Loan Types", roles: ["ADMIN", "MANAGER"], columns: ["LOAN_TYPE_ID", "TYPE_NAME", "MIN_AMOUNT", "MAX_AMOUNT", "ANNUAL_INTEREST_RATE", "STATUS"], search: ["TYPE_NAME", "STATUS"], sort: ["LOAN_TYPE_ID", "TYPE_NAME", "MIN_AMOUNT", "STATUS"], from: "loan_types", scope: "1=1" },
  "loan-payments": { label: "Loan Payments", roles: ["ADMIN", "MANAGER"], columns: ["PAYMENT_ID", "LOAN_NUMBER", "ACCOUNT_NUMBER", "AMOUNT", "PAYMENT_DATE"], search: ["l.LOAN_NUMBER", "a.ACCOUNT_NUMBER"], sort: ["PAYMENT_ID", "AMOUNT", "PAYMENT_DATE"], from: "loan_payments p JOIN loans l ON l.loan_id=p.loan_id JOIN accounts a ON a.account_id=p.account_id", select: "p.payment_id,l.loan_number,a.account_number,p.amount,p.payment_date", scope: "a.branch_id=:branchId" },
  "audit-logs": { label: "Audit Logs", roles: ["ADMIN"], columns: ["AUDIT_ID", "TABLE_NAME", "RECORD_ID", "ACTION_NAME", "ACTION_BY", "ACTION_DATE"], search: ["TABLE_NAME", "ACTION_NAME", "ACTION_BY"], sort: ["AUDIT_ID", "TABLE_NAME", "ACTION_NAME", "ACTION_DATE"], from: "audit_log", scope: "1=1" },
  "login-history": { label: "Login History", roles: ["ADMIN", "MANAGER"], columns: ["LOGIN_HISTORY_ID", "ATTEMPTED_USERNAME", "SUCCESS_FLAG", "EVENT_TYPE", "FAILURE_REASON", "OCCURRED_AT"], search: ["h.ATTEMPTED_USERNAME", "h.EVENT_TYPE", "h.FAILURE_REASON"], sort: ["LOGIN_HISTORY_ID", "OCCURRED_AT", "SUCCESS_FLAG"], from: "login_history h LEFT JOIN users u ON u.user_id=h.user_id LEFT JOIN employees e ON e.employee_id=u.employee_id", select: "h.login_history_id,h.attempted_username,h.success_flag,h.event_type,h.failure_reason,h.occurred_at", scope: "e.branch_id=:branchId" },
};

function getResource(key, role) {
  const resource = resources[String(key || "").toLowerCase()];
  if (!resource || !resource.roles.includes(role)) { const error = new Error("Unknown or unauthorized explorer resource."); error.status = 400; throw error; }
  return resource;
}

function selectFor(resource) { return resource.select || resource.columns.map((column) => column.toLowerCase()).join(","); }
function buildQuery(resource, req) {
  const { page, pageSize, offset } = pageOptions(req.query);
  const sort = String(req.query.sort || resource.sort[0]).toUpperCase();
  const direction = String(req.query.direction || "DESC").toUpperCase();
  if (!resource.sort.includes(sort)) { const error = new Error("Invalid sort column."); error.status = 400; throw error; }
  if (!["ASC", "DESC"].includes(direction)) { const error = new Error("Invalid sort direction."); error.status = 400; throw error; }
  const search = String(req.query.search || "").trim().toLowerCase();
  const searchSql = search ? ` AND (${resource.search.map((column) => `LOWER(${column}) LIKE :search`).join(" OR ")})` : "";
  const branchScope = req.user.role === "MANAGER" && resource.scope !== "1=1" ? ` AND (${resource.scope})` : "";
  const binds = { offset, pageSize };
  if (search) binds.search = `%${search}%`;
  if (req.user.role === "MANAGER" && resource.scope !== "1=1") binds.branchId = req.user.branchId;
  return { sql: `SELECT ${selectFor(resource)},COUNT(*) OVER() total_count FROM ${resource.from} WHERE 1=1${searchSql}${branchScope} ORDER BY ${sort} ${direction} OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`, binds, page, pageSize, sort, direction };
}

function csv(rows) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]).filter((key) => key !== "TOTAL_COUNT");
  const cell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [keys.join(","), ...rows.map((row) => keys.map((key) => cell(row[key])).join(","))].join("\r\n");
}

async function listResource(req, res, next) {
  try {
    const resource = getResource(req.params.resource, req.user.role);
    await withConnection(getConnection, async (connection) => {
      const query = buildQuery(resource, req);
      const result = await connection.execute(query.sql, query.binds);
      if (String(req.query.format).toLowerCase() === "csv") {
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename=${req.params.resource}.csv`);
        return res.send(csv(result.rows));
      }
      res.json({ resource: req.params.resource, columns: resource.columns, items: result.rows, page: query.page, pageSize: query.pageSize, total: result.rows[0]?.TOTAL_COUNT || 0 });
    });
  } catch (error) { next(error); }
}

async function listResources(req, res) { res.json(Object.entries(resources).filter(([, resource]) => resource.roles.includes(req.user.role)).map(([key, resource]) => ({ key, label: resource.label, columns: resource.columns, search: resource.search, sort: resource.sort }))); }

module.exports = { resources, getResource, buildQuery, listResource, listResources };
