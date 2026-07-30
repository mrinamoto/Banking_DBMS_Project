const oracledb = require("oracledb");
const { getConnection } = require("../config/db");
const { hashPassword, verifyPassword } = require("../utils/passwords");
const { assertAccountAccess, setClientIdentifier } = require("../utils/authorization");
const { requireFields, pageOptions, withConnection } = require("../utils/http");

function badRequest(message) { const error = new Error(message); error.status = 400; return error; }
function forbidden(message) { const error = new Error(message); error.status = 403; return error; }
function notFound(message) { const error = new Error(message); error.status = 404; return error; }
function assertSupportedReversal(type) { if (!['DEPOSIT', 'WITHDRAWAL'].includes(type)) throw badRequest("Only deposits and withdrawals can be reversed."); }
function assertBeneficiaryAccounts(sourceId, targetId) { if (Number(sourceId) === Number(targetId)) throw badRequest("Source and beneficiary accounts must differ."); }
function validateKycDecision(decision, reason) { const normalized = String(decision || '').toUpperCase(); if (!['VERIFIED', 'REJECTED'].includes(normalized)) throw badRequest("Decision must be VERIFIED or REJECTED."); if (normalized === 'REJECTED' && !String(reason || '').trim()) throw badRequest("Rejection reason is required."); return normalized; }

function dateRange(query) {
  const from = String(query.from || query.fromDate || "").trim();
  const to = String(query.to || query.toDate || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) throw badRequest("From and to dates must use YYYY-MM-DD.");
  for (const value of [from, to]) { const [year, month, day] = value.split('-').map(Number); const candidate = new Date(Date.UTC(year, month - 1, day)); if (candidate.getUTCFullYear() !== year || candidate.getUTCMonth() !== month - 1 || candidate.getUTCDate() !== day) throw badRequest("Enter real calendar dates."); }
  if (from > to) throw badRequest("The from date cannot be after the to date.");
  return { from, to };
}

async function getAccount(connection, user, accountNumber) {
  requireFields({ accountNumber }, ["accountNumber"]);
  return assertAccountAccess(connection, user, String(accountNumber).trim());
}

function csv(rows) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const cell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [keys.join(","), ...rows.map((row) => keys.map((key) => cell(row[key])).join(","))].join("\r\n");
}
function summarizeStatement(openingBalance, rows) {
  return { openingBalance, closingBalance: rows.length ? rows[rows.length - 1].RUNNING_BALANCE : openingBalance, totalCredit: rows.reduce((sum, row) => sum + Number(row.CREDIT || 0), 0), totalDebit: rows.reduce((sum, row) => sum + Number(row.DEBIT || 0), 0), transactionCount: rows.length };
}

async function statement(req, res, next) {
  try {
    const { from, to } = dateRange(req.query);
    await withConnection(getConnection, async (connection) => {
      const account = await getAccount(connection, req.user, req.query.accountNumber);
      const opening = await connection.execute(
        `SELECT NVL(
          (SELECT new_balance FROM (SELECT new_balance FROM transactions WHERE account_id=:accountId AND transaction_date < TO_DATE(:fromDate,'YYYY-MM-DD') ORDER BY transaction_date DESC,transaction_id DESC) WHERE ROWNUM=1),
          (SELECT previous_balance FROM (SELECT previous_balance FROM transactions WHERE account_id=:accountId ORDER BY transaction_date,transaction_id) WHERE ROWNUM=1), 0) opening_balance
           FROM dual`, { accountId: account.ACCOUNT_ID, fromDate: from }
      );
      const result = await connection.execute(
        `SELECT transaction_id,reference_no,transaction_type,amount,previous_balance,new_balance running_balance,status,transaction_date,
                CASE WHEN transaction_type IN ('DEPOSIT','TRANSFER_CREDIT','LOAN_DISBURSEMENT','REVERSAL_CREDIT') THEN amount ELSE 0 END credit,
                CASE WHEN transaction_type IN ('WITHDRAWAL','TRANSFER_DEBIT','LOAN_PAYMENT','REVERSAL_DEBIT') THEN amount ELSE 0 END debit
           FROM transactions
          WHERE account_id=:accountId AND transaction_date>=TO_DATE(:fromDate,'YYYY-MM-DD') AND transaction_date<TO_DATE(:toDate,'YYYY-MM-DD')+1
          ORDER BY transaction_date,transaction_id`, { accountId: account.ACCOUNT_ID, fromDate: from, toDate: to }
      );
      const rows = result.rows;
      const openingBalance = Number(opening.rows[0].OPENING_BALANCE || 0);
      const payload = { accountNumber: account.ACCOUNT_NUMBER, from, to, ...summarizeStatement(openingBalance, rows), rows };
      if (String(req.query.format).toLowerCase() === "csv") { res.setHeader("Content-Type", "text/csv; charset=utf-8"); res.setHeader("Content-Disposition", `attachment; filename=statement-${account.ACCOUNT_NUMBER}-${from}-${to}.csv`); return res.send(csv(rows)); }
      res.json(payload);
    });
  } catch (error) { next(error); }
}

async function reverseTransaction(req, res, next) {
  let connection;
  try {
    if (!['ADMIN', 'MANAGER'].includes(req.user.role)) throw forbidden("Only Admins and Managers can reverse transactions.");
    requireFields(req.body, ["reason"]);
    connection = await getConnection();
    const originalResult = await connection.execute(
      `SELECT t.transaction_id,t.account_id,a.account_number,t.transaction_type,t.amount,t.previous_balance,t.new_balance,t.status,t.transaction_date,a.branch_id
         FROM transactions t JOIN accounts a ON a.account_id=t.account_id
        WHERE t.transaction_id=:id`, { id: Number(req.params.id) }
    );
    const original = originalResult.rows[0];
    if (!original) throw notFound("Transaction not found.");
    await assertAccountAccess(connection, req.user, original.ACCOUNT_NUMBER);
    assertSupportedReversal(original.TRANSACTION_TYPE);
    if (original.STATUS !== 'SUCCESS') throw badRequest("Only successful transactions can be reversed.");
    await setClientIdentifier(connection, req.user);
    const result = await connection.execute(
      `BEGIN pkg_banking_operations.reverse_transaction(:transactionId,:userId,:reason,:reference); END;`,
      { transactionId: Number(req.params.id), userId: req.user.id, reason: String(req.body.reason).trim(), reference: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 100 } }
    );
    await connection.commit();
    res.status(201).json({ originalTransactionId: original.TRANSACTION_ID, reversalReference: result.outBinds.reference, message: "Transaction reversed." });
  } catch (error) { if (connection) await connection.rollback(); next(error); }
  finally { if (connection) await connection.close(); }
}

async function getSettings(req, res, next) {
  try {
    await withConnection(getConnection, async (connection) => {
      const [userResult, preferences, history] = await Promise.all([
        connection.execute(`SELECT u.username,u.role,u.is_active,u.account_locked,u.must_change_password,u.failed_login_count,u.last_login,u.customer_id,u.employee_id,c.first_name customer_first_name,c.last_name customer_last_name,c.phone customer_phone,c.email customer_email,c.address customer_address,e.first_name employee_first_name,e.last_name employee_last_name,e.email employee_email,e.phone employee_phone FROM users u LEFT JOIN customers c ON c.customer_id=u.customer_id LEFT JOIN employees e ON e.employee_id=u.employee_id WHERE u.user_id=:id`, { id: req.user.id }),
        connection.execute("SELECT theme,rows_per_page,currency_display,notifications_enabled FROM user_preferences WHERE user_id=:id", { id: req.user.id }),
        connection.execute("SELECT attempted_username,success_flag,event_type,failure_reason,occurred_at FROM login_history WHERE user_id=:id ORDER BY occurred_at DESC FETCH FIRST 10 ROWS ONLY", { id: req.user.id }),
      ]);
      const profile = userResult.rows[0];
      if (!profile) throw notFound("User session profile not found.");
      res.json({ profile, preferences: preferences.rows[0] || { THEME: "SYSTEM", ROWS_PER_PAGE: 20, CURRENCY_DISPLAY: "BDT", NOTIFICATIONS_ENABLED: "Y" }, loginHistory: history.rows });
    });
  } catch (error) { next(error); }
}

async function updateProfile(req, res, next) {
  let connection;
  try {
    connection = await getConnection();
    await setClientIdentifier(connection, req.user);
    let result;
    if (req.user.role === 'CUSTOMER') {
      requireFields(req.body, ['firstName', 'lastName', 'phone', 'address']);
      result = await connection.execute("UPDATE customers SET first_name=:firstName,last_name=:lastName,phone=:phone,email=:email,address=:address,updated_at=SYSTIMESTAMP WHERE customer_id=:id", { ...req.body, email: req.body.email || null, id: req.user.customerId });
    } else if (['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(req.user.role)) {
      requireFields(req.body, ['firstName', 'lastName', 'email', 'phone']);
      result = await connection.execute("UPDATE employees SET first_name=:firstName,last_name=:lastName,email=:email,phone=:phone WHERE employee_id=:id", { ...req.body, id: req.user.employeeId });
    } else throw forbidden("Profile editing is unavailable for this session.");
    if (!result.rowsAffected) throw notFound("Linked profile not found.");
    await connection.commit(); res.json({ message: "Profile updated." });
  } catch (error) { if (connection) await connection.rollback(); next(error); }
  finally { if (connection) await connection.close(); }
}

async function changePassword(req, res, next) {
  let connection;
  try {
    requireFields(req.body, ['currentPassword', 'newPassword', 'confirmPassword']);
    if (req.body.newPassword !== req.body.confirmPassword) throw badRequest("New passwords do not match.");
    connection = await getConnection();
    const current = await connection.execute("SELECT password_hash FROM users WHERE user_id=:id", { id: req.user.id });
    if (!current.rows[0] || !(await verifyPassword(req.body.currentPassword, current.rows[0].PASSWORD_HASH))) throw badRequest("Current password is incorrect.");
    const passwordHash = await hashPassword(req.body.newPassword);
    await setClientIdentifier(connection, req.user);
    await connection.execute("UPDATE users SET password_hash=:passwordHash,must_change_password='N',password_changed_at=SYSTIMESTAMP,updated_at=SYSTIMESTAMP WHERE user_id=:id", { passwordHash, id: req.user.id });
    await connection.execute("INSERT INTO login_history(user_id,attempted_username,success_flag,event_type) VALUES(:userId,:username,'Y','PASSWORD_CHANGE')", { userId: req.user.id, username: req.user.username });
    await connection.commit(); res.json({ message: "Password changed." });
  } catch (error) { if (connection) await connection.rollback(); next(error); }
  finally { if (connection) await connection.close(); }
}

async function updatePreferences(req, res, next) {
  let connection;
  try {
    const theme = String(req.body.theme || 'SYSTEM').toUpperCase(); const rowsPerPage = Number(req.body.rowsPerPage || 20); const notifications = req.body.notificationsEnabled === false ? 'N' : 'Y';
    if (!['LIGHT', 'DARK', 'SYSTEM'].includes(theme) || !Number.isInteger(rowsPerPage) || rowsPerPage < 5 || rowsPerPage > 100) throw badRequest("Invalid preference values.");
    connection = await getConnection();
    await connection.execute(`MERGE INTO user_preferences p USING (SELECT :userId user_id FROM dual) s ON (p.user_id=s.user_id) WHEN MATCHED THEN UPDATE SET theme=:theme,rows_per_page=:rowsPerPage,notifications_enabled=:notifications,updated_at=SYSTIMESTAMP WHEN NOT MATCHED THEN INSERT(user_id,theme,rows_per_page,currency_display,notifications_enabled) VALUES(:userId,:theme,:rowsPerPage,'BDT',:notifications)`, { userId: req.user.id, theme, rowsPerPage, notifications });
    await connection.commit(); res.json({ message: "Preferences saved." });
  } catch (error) { if (connection) await connection.rollback(); next(error); }
  finally { if (connection) await connection.close(); }
}

async function listLoginHistory(req, res, next) { return getSettings(req, res, next); }

async function listBeneficiaries(req, res, next) {
  try { await withConnection(getConnection, async (connection) => {
    const { page, pageSize, offset } = pageOptions(req.query); const binds = { offset, pageSize, search: `%${String(req.query.search || '').toLowerCase()}%` }; let scope = '';
    if (req.user.role === 'CUSTOMER') { scope = ' AND b.customer_id=:customerId'; binds.customerId = req.user.customerId; }
    else if (req.user.role === 'MANAGER') { scope = ' AND EXISTS (SELECT 1 FROM accounts sa WHERE sa.account_id=b.source_account_id AND sa.branch_id=:branchId)'; binds.branchId = req.user.branchId; }
    const result = await connection.execute(`SELECT b.beneficiary_id,b.customer_id,b.nickname,b.status,b.created_at,b.updated_at,sa.account_number source_account_number,ta.account_number beneficiary_account_number,COUNT(*) OVER() total_count FROM beneficiaries b JOIN accounts sa ON sa.account_id=b.source_account_id JOIN accounts ta ON ta.account_id=b.beneficiary_account_id WHERE LOWER(b.nickname||' '||sa.account_number||' '||ta.account_number) LIKE :search${scope} ORDER BY b.updated_at DESC OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`, binds);
    res.json({ items: result.rows, page, pageSize, total: result.rows[0]?.TOTAL_COUNT || 0 });
  }); } catch (error) { next(error); }
}

async function createBeneficiary(req, res, next) {
  let connection;
  try {
    if (req.user.role !== 'CUSTOMER') throw forbidden("Only customers can create beneficiaries.");
    requireFields(req.body, ['sourceAccountNumber', 'beneficiaryAccountNumber', 'nickname']); connection = await getConnection();
    const source = await assertAccountAccess(connection, req.user, req.body.sourceAccountNumber); const targetResult = await connection.execute("SELECT account_id,account_number FROM accounts WHERE account_number=:accountNumber AND status='ACTIVE'", { accountNumber: req.body.beneficiaryAccountNumber }); const target = targetResult.rows[0];
    if (!target) throw badRequest("Beneficiary account was not found or is inactive."); assertBeneficiaryAccounts(source.ACCOUNT_ID, target.ACCOUNT_ID);
    const duplicate = await connection.execute("SELECT 1 FROM beneficiaries WHERE customer_id=:customerId AND source_account_id=:sourceId AND beneficiary_account_id=:targetId AND status='ACTIVE'", { customerId: req.user.customerId, sourceId: source.ACCOUNT_ID, targetId: target.ACCOUNT_ID }); if (duplicate.rows.length) throw badRequest("This beneficiary is already active.");
    await setClientIdentifier(connection, req.user); const result = await connection.execute("INSERT INTO beneficiaries(customer_id,source_account_id,beneficiary_account_id,nickname) VALUES(:customerId,:sourceId,:targetId,:nickname) RETURNING beneficiary_id INTO :id", { customerId: req.user.customerId, sourceId: source.ACCOUNT_ID, targetId: target.ACCOUNT_ID, nickname: String(req.body.nickname).trim(), id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } }); await connection.commit(); res.status(201).json({ id: result.outBinds.id[0], message: "Beneficiary added." });
  } catch (error) { if (connection) await connection.rollback(); next(error); } finally { if (connection) await connection.close(); }
}

async function updateBeneficiary(req, res, next) {
  let connection;
  try { if (req.user.role !== 'CUSTOMER') throw forbidden("Only customers can update beneficiaries."); connection = await getConnection(); const current = await connection.execute("SELECT beneficiary_id FROM beneficiaries WHERE beneficiary_id=:id AND customer_id=:customerId", { id: Number(req.params.id), customerId: req.user.customerId }); if (!current.rows[0]) throw notFound("Beneficiary not found."); if (req.body.status && !['ACTIVE', 'INACTIVE'].includes(req.body.status)) throw badRequest("Invalid beneficiary status."); if (!req.body.nickname && !req.body.status) throw badRequest("Provide a nickname or status."); await setClientIdentifier(connection, req.user); await connection.execute("UPDATE beneficiaries SET nickname=NVL(:nickname,nickname),status=NVL(:status,status),updated_at=SYSTIMESTAMP WHERE beneficiary_id=:id", { nickname: req.body.nickname ? String(req.body.nickname).trim() : null, status: req.body.status || null, id: Number(req.params.id) }); await connection.commit(); res.json({ message: "Beneficiary updated." }); } catch (error) { if (connection) await connection.rollback(); next(error); } finally { if (connection) await connection.close(); }
}

async function listKyc(req, res, next) {
  try { await withConnection(getConnection, async (connection) => { const { page, pageSize, offset } = pageOptions(req.query); const binds = { offset, pageSize }; let scope = ''; if (req.user.role === 'CUSTOMER') { scope = ' AND k.customer_id=:customerId'; binds.customerId = req.user.customerId; } else if (req.user.role === 'MANAGER') { scope = ' AND EXISTS (SELECT 1 FROM accounts a WHERE a.customer_id=k.customer_id AND a.branch_id=:branchId)'; binds.branchId = req.user.branchId; } const result = await connection.execute(`SELECT k.kyc_id,k.customer_id,k.document_type,k.document_reference,k.status,k.submitted_at,k.reviewed_by,k.reviewed_at,k.rejection_reason,k.updated_at,c.first_name||' '||c.last_name customer_name,COUNT(*) OVER() total_count FROM customer_kyc k JOIN customers c ON c.customer_id=k.customer_id WHERE 1=1${scope} ORDER BY k.updated_at DESC OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`, binds); res.json({ items: result.rows, page, pageSize, total: result.rows[0]?.TOTAL_COUNT || 0 }); }); } catch (error) { next(error); }
}

async function submitKyc(req, res, next) {
  let connection;
  try { if (req.user.role !== 'CUSTOMER') throw forbidden("Only customers can submit KYC."); requireFields(req.body, ['documentType', 'documentReference']); const documentType = String(req.body.documentType).trim(); const documentReference = String(req.body.documentReference).trim(); connection = await getConnection(); const pending = await connection.execute("SELECT kyc_id,status FROM customer_kyc WHERE customer_id=:customerId AND status='PENDING' FETCH FIRST 1 ROW ONLY", { customerId: req.user.customerId }); if (pending.rows[0]) { await connection.execute("UPDATE customer_kyc SET document_type=:documentType,document_reference=:documentReference,updated_at=SYSTIMESTAMP WHERE kyc_id=:id", { documentType, documentReference, id: pending.rows[0].KYC_ID }); } else { await connection.execute("INSERT INTO customer_kyc(customer_id,document_type,document_reference,status) VALUES(:customerId,:documentType,:documentReference,'PENDING')", { customerId: req.user.customerId, documentType, documentReference }); } await connection.commit(); res.status(201).json({ message: "KYC submission saved." }); } catch (error) { if (connection) await connection.rollback(); next(error); } finally { if (connection) await connection.close(); }
}

async function updateKyc(req, res, next) { return submitKyc(req, res, next); }

async function reviewKyc(req, res, next) {
  let connection;
  try { if (!['ADMIN', 'MANAGER'].includes(req.user.role)) throw forbidden("Only Admins and Managers can review KYC."); requireFields(req.body, ['decision']); const decision = validateKycDecision(req.body.decision, req.body.rejectionReason); connection = await getConnection(); const current = await connection.execute("SELECT k.kyc_id,k.customer_id FROM customer_kyc k WHERE k.kyc_id=:id", { id: Number(req.params.id) }); if (!current.rows[0]) throw notFound("KYC record not found."); if (req.user.role === 'MANAGER') { const scope = await connection.execute("SELECT 1 FROM accounts WHERE customer_id=:customerId AND branch_id=:branchId FETCH FIRST 1 ROW ONLY", { customerId: current.rows[0].CUSTOMER_ID, branchId: req.user.branchId }); if (!scope.rows.length) throw forbidden("This KYC record is outside your branch."); } await setClientIdentifier(connection, req.user); await connection.execute("UPDATE customer_kyc SET status=:status,reviewed_by=:reviewedBy,reviewed_at=SYSTIMESTAMP,rejection_reason=:reason,updated_at=SYSTIMESTAMP WHERE kyc_id=:id", { status: decision, reviewedBy: req.user.id, reason: decision === 'REJECTED' ? String(req.body.rejectionReason).trim() : null, id: Number(req.params.id) }); await connection.execute("INSERT INTO audit_log(table_name,record_id,action_name,action_by,new_summary) VALUES('CUSTOMER_KYC',:id,'KYC_REVIEW',:actor,:summary)", { id: Number(req.params.id), actor: req.user.username, summary: `status=${decision}` }); await connection.commit(); res.json({ message: `KYC marked ${decision.toLowerCase()}.` }); } catch (error) { if (connection) await connection.rollback(); next(error); } finally { if (connection) await connection.close(); }
}

module.exports = { statement, reverseTransaction, getSettings, updateProfile, changePassword, updatePreferences, listLoginHistory, listBeneficiaries, createBeneficiary, updateBeneficiary, listKyc, submitKyc, updateKyc, reviewKyc, dateRange, summarizeStatement, assertSupportedReversal, assertBeneficiaryAccounts, validateKycDecision };
