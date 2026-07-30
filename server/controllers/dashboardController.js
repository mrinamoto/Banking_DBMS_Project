const { getConnection } = require("../config/db");
const { withConnection } = require("../utils/http");

async function getDashboardStats(req, res, next) {
  try {
    await withConnection(getConnection, async (connection) => {
      const role = req.user.role;
      const branchId = ["MANAGER", "EMPLOYEE"].includes(role) ? req.user.branchId : null;
      const customerId = role === "CUSTOMER" ? req.user.customerId : null;
      const scope = { branchId, customerId };
      const [branch, customers, accounts, employees, loans, transactions, volume, frozen, recent, audit] = await Promise.all([
        connection.execute("SELECT branch_name FROM branches WHERE branch_id=:branchId", { branchId }),
        connection.execute("SELECT COUNT(*) count FROM customers c WHERE (:customerId IS NULL OR c.customer_id=:customerId) AND (:branchId IS NULL OR EXISTS (SELECT 1 FROM accounts a WHERE a.customer_id=c.customer_id AND a.branch_id=:branchId))", scope),
        connection.execute("SELECT COUNT(*) count,NVL(SUM(a.balance),0) total_balance FROM accounts a WHERE (:customerId IS NULL OR a.customer_id=:customerId) AND (:branchId IS NULL OR a.branch_id=:branchId)", scope),
        connection.execute("SELECT COUNT(*) count FROM employees e WHERE (:customerId IS NULL AND (:branchId IS NULL OR e.branch_id=:branchId))", { branchId, customerId }),
        connection.execute("SELECT COUNT(*) count FROM loans l JOIN accounts a ON a.account_id=l.disbursement_account_id WHERE (:customerId IS NULL OR l.customer_id=:customerId) AND (:branchId IS NULL OR a.branch_id=:branchId) AND l.status IN ('PENDING','APPROVED','ACTIVE')", scope),
        connection.execute("SELECT COUNT(*) count FROM transactions t JOIN accounts a ON a.account_id=t.account_id WHERE t.transaction_date>=TRUNC(SYSDATE) AND (:customerId IS NULL OR a.customer_id=:customerId) AND (:branchId IS NULL OR a.branch_id=:branchId)", scope),
        connection.execute("SELECT NVL(SUM(CASE WHEN t.transaction_type='TRANSFER_CREDIT' THEN 0 ELSE t.amount END),0) volume FROM transactions t JOIN accounts a ON a.account_id=t.account_id WHERE (:customerId IS NULL OR a.customer_id=:customerId) AND (:branchId IS NULL OR a.branch_id=:branchId)", scope),
        connection.execute("SELECT COUNT(*) count FROM accounts a WHERE a.status='FROZEN' AND (:customerId IS NULL OR a.customer_id=:customerId) AND (:branchId IS NULL OR a.branch_id=:branchId)", scope),
        connection.execute("SELECT t.reference_no,t.transaction_type,t.amount,t.transaction_date FROM transactions t JOIN accounts a ON a.account_id=t.account_id WHERE (:customerId IS NULL OR a.customer_id=:customerId) AND (:branchId IS NULL OR a.branch_id=:branchId) ORDER BY t.transaction_date DESC FETCH FIRST 8 ROWS ONLY", scope),
        connection.execute("SELECT audit_id,table_name,action_name,action_by,action_date FROM audit_log WHERE (:branchId IS NULL OR action_by=:actor) ORDER BY action_date DESC FETCH FIRST 6 ROWS ONLY", { branchId, actor: req.user.username })
      ]);
      const totalCustomers = Number(customers.rows[0].COUNT || 0);
      const totalAccounts = Number(accounts.rows[0].COUNT || 0);
      const totalEmployees = Number(employees.rows[0].COUNT || 0);
      const pendingLoans = Number(loans.rows[0].COUNT || 0);
      res.json({ role, branchName: branch.rows[0]?.BRANCH_NAME || null, totalCustomers, totalAccounts, totalEmployees, totalLoans: pendingLoans, pendingLoans, totalBalance: accounts.rows[0].TOTAL_BALANCE, todayTransactions: Number(transactions.rows[0].COUNT || 0), transactionVolume: volume.rows[0].VOLUME, frozenAccounts: Number(frozen.rows[0].COUNT || 0), recentTransactions: recent.rows, recentAudit: audit.rows, quickLinks: role === "ADMIN" ? ["/user-management", "/database-explorer"] : role === "EMPLOYEE" ? ["/accounts", "/customers", "/transactions"] : role === "CUSTOMER" ? ["/transactions", "/loans"] : ["/customers", "/employees", "/accounts"] });
    });
  } catch (error) { next(error); }
}

module.exports = { getDashboardStats };
