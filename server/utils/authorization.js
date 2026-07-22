const scopedStaffRoles = new Set(["MANAGER", "EMPLOYEE"]);

function forbidden(message = "This record belongs to another branch.") {
  const error = new Error(message);
  error.status = 403;
  return error;
}

async function setClientIdentifier(connection, user) {
  const identifier = `${String(user.username).slice(0, 60)}:${user.id}`;
  await connection.execute(
    "BEGIN DBMS_SESSION.SET_IDENTIFIER(:identifier); END;",
    { identifier }
  );
}

function assertBranchId(user, branchId) {
  if (scopedStaffRoles.has(user.role) && Number(branchId) !== Number(user.branchId)) {
    throw forbidden();
  }
}

async function getAccountScope(connection, accountNumber) {
  const result = await connection.execute(
    `SELECT account_id, customer_id, branch_id, account_number
       FROM accounts
      WHERE account_number = :accountNumber`,
    { accountNumber }
  );
  if (!result.rows[0]) {
    const error = new Error("Account not found.");
    error.status = 400;
    throw error;
  }
  return result.rows[0];
}

async function assertAccountAccess(connection, user, accountNumber, options = {}) {
  const account = await getAccountScope(connection, accountNumber);
  if (user.role === "CUSTOMER" && Number(account.CUSTOMER_ID) !== Number(user.customerId)) {
    throw forbidden("You may use only an account you own.");
  }
  if (scopedStaffRoles.has(user.role) && Number(account.BRANCH_ID) !== Number(user.branchId)) {
    throw forbidden();
  }
  if (options.customerId && Number(account.CUSTOMER_ID) !== Number(options.customerId)) {
    throw forbidden("The account does not belong to the selected customer.");
  }
  return account;
}

async function getLoanScope(connection, loanId) {
  const result = await connection.execute(
    `SELECT l.loan_id, l.customer_id, a.branch_id
       FROM loans l
       JOIN accounts a ON a.account_id = l.disbursement_account_id
      WHERE l.loan_id = :loanId`,
    { loanId }
  );
  if (!result.rows[0]) {
    const error = new Error("Loan not found.");
    error.status = 404;
    throw error;
  }
  return result.rows[0];
}

async function assertLoanAccess(connection, user, loanId) {
  const loan = await getLoanScope(connection, loanId);
  if (user.role === "CUSTOMER" && Number(loan.CUSTOMER_ID) !== Number(user.customerId)) {
    throw forbidden("You may access only your own loan.");
  }
  if (scopedStaffRoles.has(user.role) && Number(loan.BRANCH_ID) !== Number(user.branchId)) {
    throw forbidden();
  }
  return loan;
}

async function assertCustomerBranch(connection, user, customerId) {
  if (!scopedStaffRoles.has(user.role)) return;
  const result = await connection.execute(
    `SELECT CASE
              WHEN NOT EXISTS (SELECT 1 FROM accounts WHERE customer_id=:customerId) THEN 1
              WHEN EXISTS (SELECT 1 FROM accounts WHERE customer_id=:customerId AND branch_id=:branchId) THEN 1
              ELSE 0
            END AS allowed
       FROM dual`,
    { customerId, branchId: user.branchId }
  );
  if (!result.rows[0].ALLOWED) throw forbidden();
}

module.exports = {
  assertAccountAccess,
  assertBranchId,
  assertCustomerBranch,
  assertLoanAccess,
  setClientIdentifier,
};
