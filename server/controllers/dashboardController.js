const {getConnection}=require('../config/db');const {withConnection}=require('../utils/http');
async function getDashboardStats(req,res,next){try{await withConnection(getConnection,async c=>{
  const binds={customerId:req.user.role==='CUSTOMER'?req.user.customerId:null,branchId:['MANAGER','EMPLOYEE'].includes(req.user.role)?req.user.branchId:null};
  const [customers,accounts,employees,loans,transactions,recent]=await Promise.all([
    c.execute(`SELECT COUNT(*) count FROM customers c WHERE (:customerId IS NULL OR c.customer_id=:customerId) AND (:branchId IS NULL OR EXISTS(SELECT 1 FROM accounts a WHERE a.customer_id=c.customer_id AND a.branch_id=:branchId))`,binds),
    c.execute(`SELECT COUNT(*) count,NVL(SUM(balance),0) total_balance FROM accounts WHERE (:customerId IS NULL OR customer_id=:customerId) AND (:branchId IS NULL OR branch_id=:branchId)`,binds),
    c.execute(`SELECT COUNT(*) count FROM employees WHERE :customerId IS NULL AND (:branchId IS NULL OR branch_id=:branchId)`,binds),
    c.execute(`SELECT COUNT(*) count FROM loans l JOIN accounts a ON a.account_id=l.disbursement_account_id WHERE (:customerId IS NULL OR l.customer_id=:customerId) AND (:branchId IS NULL OR a.branch_id=:branchId)`,binds),
    c.execute(`SELECT NVL(SUM(CASE WHEN t.transaction_type='TRANSFER_CREDIT' THEN 0 ELSE t.amount END),0) volume FROM transactions t JOIN accounts a ON a.account_id=t.account_id WHERE (:customerId IS NULL OR a.customer_id=:customerId) AND (:branchId IS NULL OR a.branch_id=:branchId)`,binds),
    c.execute(`SELECT t.reference_no,t.transaction_type,t.amount,t.transaction_date FROM transactions t JOIN accounts a ON a.account_id=t.account_id WHERE (:customerId IS NULL OR a.customer_id=:customerId) AND (:branchId IS NULL OR a.branch_id=:branchId) ORDER BY t.transaction_date DESC FETCH FIRST 6 ROWS ONLY`,binds)
  ]);
  res.json({totalCustomers:customers.rows[0].COUNT,totalAccounts:accounts.rows[0].COUNT,totalEmployees:employees.rows[0].COUNT,totalLoans:loans.rows[0].COUNT,totalBalance:accounts.rows[0].TOTAL_BALANCE,transactionVolume:transactions.rows[0].VOLUME,recentTransactions:recent.rows});
});}catch(e){next(e)}}module.exports={getDashboardStats};
