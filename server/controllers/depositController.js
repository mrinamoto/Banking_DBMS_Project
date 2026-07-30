const oracledb = require("oracledb");
const { getConnection } = require("../config/db");
const { assertAccountAccess } = require("../utils/authorization");
const { requireFields, pageOptions, withConnection } = require("../utils/http");
const { calculateDeposit, calculateDps, earlyWithdrawalPreview } = require("../utils/depositCalculations");

function httpError(status, message) { const error = new Error(message); error.status = status; return error; }
const badRequest = (message) => httpError(400, message);
const forbidden = (message) => httpError(403, message);
const notFound = (message) => httpError(404, message);

function dateText(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const match = String(value || "").match(/\d{4}-\d{2}-\d{2}/);
  if (!match) throw badRequest("Database returned an invalid certificate date.");
  return match[0];
}

function schemeFromRow(row) {
  return row ? {
    schemeId: row.SCHEME_ID, schemeCode: row.SCHEME_CODE, schemeName: row.SCHEME_NAME,
    schemeType: row.SCHEME_TYPE, minimumAmount: row.MINIMUM_AMOUNT, maximumAmount: row.MAXIMUM_AMOUNT,
    minimumMonths: row.MINIMUM_MONTHS, maximumMonths: row.MAXIMUM_MONTHS, annualProfitRate: row.ANNUAL_PROFIT_RATE,
    calculationMethod: row.CALCULATION_METHOD, paymentFrequency: row.PAYMENT_FREQUENCY,
    taxPercentage: row.TAX_PERCENTAGE, earlyWithdrawalRate: row.EARLY_WITHDRAWAL_RATE,
    seniorOnly: row.SENIOR_ONLY, studentOnly: row.STUDENT_ONLY, status: row.STATUS
  } : null;
}

function schemeInput(body, scheme) {
  return {
    principalAmount: body.principalAmount,
    monthlyContribution: body.monthlyContribution,
    durationMonths: body.durationMonths,
    annualProfitRate: body.annualProfitRate ?? scheme.annualProfitRate,
    taxPercentage: body.taxPercentage ?? scheme.taxPercentage,
    calculationMethod: body.calculationMethod || scheme.calculationMethod,
    openingDate: body.openingDate
  };
}

async function fetchScheme(connection, schemeId, activeOnly = true) {
  if (!Number.isInteger(Number(schemeId))) throw badRequest("A valid schemeId is required.");
  const result = await connection.execute(`SELECT scheme_id,scheme_code,scheme_name,scheme_type,minimum_amount,maximum_amount,minimum_months,maximum_months,annual_profit_rate,calculation_method,payment_frequency,tax_percentage,early_withdrawal_rate,senior_only,student_only,status FROM deposit_schemes WHERE scheme_id=:schemeId${activeOnly ? " AND status='ACTIVE'" : ""}`, { schemeId: Number(schemeId) });
  if (!result.rows[0]) throw notFound("Deposit scheme not found or inactive.");
  return schemeFromRow(result.rows[0]);
}

async function listSchemes(req, res, next) {
  try { await withConnection(getConnection, async (connection) => { const activeOnly = req.user.role === "CUSTOMER"; const result = await connection.execute(`SELECT scheme_id,scheme_code,scheme_name,scheme_type,minimum_amount,maximum_amount,minimum_months,maximum_months,annual_profit_rate,calculation_method,payment_frequency,tax_percentage,early_withdrawal_rate,senior_only,student_only,status,updated_at FROM deposit_schemes ${activeOnly ? "WHERE status='ACTIVE'" : ""} ORDER BY scheme_name`); res.json(result.rows.map(schemeFromRow)); }); } catch (error) { next(error); }
}

async function createScheme(req, res, next) {
  let connection;
  try {
    if (req.user.role !== "ADMIN") throw forbidden("Only Admins can create deposit schemes.");
    requireFields(req.body, ["schemeCode", "schemeName", "schemeType", "minimumAmount", "minimumMonths", "maximumMonths", "annualProfitRate"]);
    connection = await getConnection();
    const result = await connection.execute(`INSERT INTO deposit_schemes(scheme_code,scheme_name,scheme_type,minimum_amount,maximum_amount,minimum_months,maximum_months,annual_profit_rate,calculation_method,payment_frequency,tax_percentage,early_withdrawal_rate,senior_only,student_only) VALUES(:schemeCode,:schemeName,:schemeType,:minimumAmount,:maximumAmount,:minimumMonths,:maximumMonths,:annualProfitRate,:calculationMethod,:paymentFrequency,:taxPercentage,:earlyWithdrawalRate,:seniorOnly,:studentOnly) RETURNING scheme_id INTO :id`, { schemeCode: String(req.body.schemeCode).trim().toUpperCase(), schemeName: String(req.body.schemeName).trim(), schemeType: String(req.body.schemeType).toUpperCase(), minimumAmount: Number(req.body.minimumAmount), maximumAmount: req.body.maximumAmount ? Number(req.body.maximumAmount) : null, minimumMonths: Number(req.body.minimumMonths), maximumMonths: Number(req.body.maximumMonths), annualProfitRate: Number(req.body.annualProfitRate), calculationMethod: req.body.calculationMethod === "MONTHLY_COMPOUND" ? "MONTHLY_COMPOUND" : "SIMPLE", paymentFrequency: req.body.paymentFrequency || "AT_MATURITY", taxPercentage: Number(req.body.taxPercentage || 0), earlyWithdrawalRate: req.body.earlyWithdrawalRate == null ? null : Number(req.body.earlyWithdrawalRate), seniorOnly: req.body.seniorOnly ? "Y" : "N", studentOnly: req.body.studentOnly ? "Y" : "N", id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } });
    await connection.commit(); res.status(201).json({ id: result.outBinds.id[0], message: "Deposit scheme created." });
  } catch (error) { if (connection) await connection.rollback(); next(error); } finally { if (connection) await connection.close(); }
}

async function updateScheme(req, res, next) {
  let connection;
  try {
    if (req.user.role !== "ADMIN") throw forbidden("Only Admins can edit deposit schemes.");
    if (req.body.status && !["ACTIVE", "INACTIVE"].includes(req.body.status)) throw badRequest("Invalid scheme status.");
    connection = await getConnection();
    const result = await connection.execute(`UPDATE deposit_schemes SET scheme_name=NVL(:schemeName,scheme_name),annual_profit_rate=NVL(:annualProfitRate,annual_profit_rate),tax_percentage=NVL(:taxPercentage,tax_percentage),early_withdrawal_rate=:earlyWithdrawalRate,status=NVL(:status,status),updated_at=SYSTIMESTAMP WHERE scheme_id=:id`, { schemeName: req.body.schemeName || null, annualProfitRate: req.body.annualProfitRate == null ? null : Number(req.body.annualProfitRate), taxPercentage: req.body.taxPercentage == null ? null : Number(req.body.taxPercentage), earlyWithdrawalRate: req.body.earlyWithdrawalRate == null ? null : Number(req.body.earlyWithdrawalRate), status: req.body.status || null, id: Number(req.params.id) });
    if (!result.rowsAffected) throw notFound("Deposit scheme not found.");
    await connection.commit(); res.json({ message: "Deposit scheme updated." });
  } catch (error) { if (connection) await connection.rollback(); next(error); } finally { if (connection) await connection.close(); }
}

async function calculate(req, res, next) {
  try { await withConnection(getConnection, async (connection) => { const scheme = await fetchScheme(connection, req.body.schemeId); const input = schemeInput(req.body, scheme); const result = scheme.schemeType === "DPS" ? calculateDps(input, scheme) : calculateDeposit(input, scheme); res.json({ scheme, ...result }); }); } catch (error) { next(error); }
}

async function createQuote(req, res, next) {
  let connection;
  try {
    if (req.user.role !== "CUSTOMER") throw forbidden("Only customers can save personal deposit quotations.");
    requireFields(req.body, ["schemeId", "durationMonths", "openingDate"]);
    if (req.body.principalAmount == null && req.body.monthlyContribution == null) throw badRequest("A principal amount or monthly contribution is required.");
    connection = await getConnection(); const scheme = await fetchScheme(connection, req.body.schemeId); const input = schemeInput(req.body, scheme); const calculation = scheme.schemeType === "DPS" ? calculateDps(input, scheme) : calculateDeposit(input, scheme);
    const principal = calculation.totalContributed ?? calculation.principal;
    const result = await connection.execute(`INSERT INTO deposit_certificates(certificate_number,customer_id,scheme_id,principal_amount,annual_profit_rate,duration_months,calculation_method,tax_percentage,expected_gross_profit,expected_tax,expected_net_profit,expected_maturity_amount,opening_date,maturity_date,status) VALUES('DPQ'||TO_CHAR(SYSTIMESTAMP,'YYYYMMDDHH24MISSFF3')||LPAD(seq_business_reference.NEXTVAL,6,'0'),:customerId,:schemeId,:principalAmount,:annualRate,:durationMonths,:method,:taxPercentage,:grossProfit,:totalTax,:netProfit,:maturityAmount,TO_DATE(:openingDate,'YYYY-MM-DD'),TO_DATE(:maturityDate,'YYYY-MM-DD'),'QUOTATION') RETURNING certificate_id,certificate_number INTO :id,:number`, { customerId: req.user.customerId, schemeId: scheme.schemeId, principalAmount: principal, annualRate: calculation.annualRate, durationMonths: calculation.durationMonths, method: calculation.calculationMethod, taxPercentage: calculation.taxPercentage, grossProfit: calculation.totalGrossProfit, totalTax: calculation.totalTax, netProfit: calculation.totalNetProfit, maturityAmount: calculation.maturityAmount, openingDate: calculation.openingDate, maturityDate: calculation.maturityDate, id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }, number: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 60 } });
    await connection.commit(); res.status(201).json({ certificateId: result.outBinds.id[0], certificateNumber: result.outBinds.number[0], calculation, disclaimer: calculation.disclaimer, message: "Educational quotation saved; no account balance was changed." });
  } catch (error) { if (connection) await connection.rollback(); next(error); } finally { if (connection) await connection.close(); }
}

async function listQuotes(req, res, next) {
  try { await withConnection(getConnection, async (connection) => { const { page, pageSize, offset } = pageOptions(req.query); const binds = { offset, pageSize }; let scope = ""; if (req.user.role === "CUSTOMER") { scope = " AND d.customer_id=:customerId"; binds.customerId = req.user.customerId; } else if (["MANAGER", "EMPLOYEE"].includes(req.user.role)) { scope = " AND EXISTS (SELECT 1 FROM accounts a WHERE a.account_id=d.account_id AND a.branch_id=:branchId)"; binds.branchId = req.user.branchId; } const result = await connection.execute(`SELECT d.certificate_id,d.certificate_number,d.customer_id,d.account_id,d.scheme_id,d.principal_amount,d.annual_profit_rate,d.duration_months,d.calculation_method,d.tax_percentage,d.expected_gross_profit,d.expected_tax,d.expected_net_profit,d.expected_maturity_amount,d.opening_date,d.maturity_date,d.status,s.scheme_name,c.first_name||' '||c.last_name customer_name,a.account_number,COUNT(*) OVER() total_count FROM deposit_certificates d JOIN deposit_schemes s ON s.scheme_id=d.scheme_id JOIN customers c ON c.customer_id=d.customer_id LEFT JOIN accounts a ON a.account_id=d.account_id WHERE 1=1${scope} ORDER BY d.maturity_date,d.created_at DESC OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`, binds); res.json({ items: result.rows, page, pageSize, total: result.rows[0]?.TOTAL_COUNT || 0 }); }); } catch (error) { next(error); }
}

function categorizeReminders(rows, now = new Date()) {
  const categories = { within7Days: [], thisMonth: [], alreadyMatured: [], renewalPending: [] }; const month = now.getUTCMonth(); const year = now.getUTCFullYear();
  for (const row of rows) { const date = row.MATURITY_DATE instanceof Date ? row.MATURITY_DATE : new Date(row.MATURITY_DATE); const item = { ...row, message: `${row.SCHEME_NAME} ${row.CERTIFICATE_NUMBER} matures on ${date.toISOString().slice(0, 10)}. Expected maturity amount: ${row.EXPECTED_MATURITY_AMOUNT} BDT.` }; if (row.STATUS === "MATURED" || date < now) categories.alreadyMatured.push(item); else if (date.getTime() <= now.getTime() + 7 * 86400000) categories.within7Days.push(item); if (date.getUTCMonth() === month && date.getUTCFullYear() === year) categories.thisMonth.push(item); if (row.STATUS === "MATURED") categories.renewalPending.push(item); }
  return categories;
}

async function reminders(req, res, next) {
  try { await withConnection(getConnection, async (connection) => { const binds = { customerId: req.user.role === "CUSTOMER" ? req.user.customerId : null, branchId: ["MANAGER", "EMPLOYEE"].includes(req.user.role) ? req.user.branchId : null }; const scope = req.user.role === "CUSTOMER" ? " AND d.customer_id=:customerId" : ["MANAGER", "EMPLOYEE"].includes(req.user.role) ? " AND EXISTS (SELECT 1 FROM accounts a WHERE a.account_id=d.account_id AND a.branch_id=:branchId)" : ""; const result = await connection.execute(`SELECT d.certificate_number,d.maturity_date,d.expected_maturity_amount,d.status,s.scheme_name,c.first_name||' '||c.last_name customer_name FROM deposit_certificates d JOIN deposit_schemes s ON s.scheme_id=d.scheme_id JOIN customers c ON c.customer_id=d.customer_id WHERE d.status IN ('QUOTATION','ACTIVE','MATURED')${scope} ORDER BY d.maturity_date`, binds); res.json(categorizeReminders(result.rows)); }); } catch (error) { next(error); }
}

async function earlyPreview(req, res, next) {
  try { await withConnection(getConnection, async (connection) => { const result = await connection.execute(`SELECT d.certificate_id,d.certificate_number,d.customer_id,d.account_id,d.principal_amount,d.annual_profit_rate,d.duration_months,d.calculation_method,d.tax_percentage,d.opening_date,d.maturity_date,s.early_withdrawal_rate,a.account_number FROM deposit_certificates d JOIN deposit_schemes s ON s.scheme_id=d.scheme_id LEFT JOIN accounts a ON a.account_id=d.account_id WHERE d.certificate_id=:id`, { id: Number(req.params.id) }); const row = result.rows[0]; if (!row) throw notFound("Quotation not found."); if (req.user.role === "CUSTOMER" && Number(row.CUSTOMER_ID) !== Number(req.user.customerId)) throw forbidden("You may preview only your own quotation."); if (["MANAGER", "EMPLOYEE"].includes(req.user.role)) { if (!row.ACCOUNT_ID || !row.ACCOUNT_NUMBER) throw forbidden("This quotation is not linked to an account in your branch."); await assertAccountAccess(connection, req.user, row.ACCOUNT_NUMBER); } const preview = earlyWithdrawalPreview({ principalAmount: row.PRINCIPAL_AMOUNT, annualProfitRate: row.ANNUAL_PROFIT_RATE, durationMonths: row.DURATION_MONTHS, calculationMethod: row.CALCULATION_METHOD, taxPercentage: row.TAX_PERCENTAGE, openingDate: dateText(row.OPENING_DATE), requestedClosingDate: req.body.requestedClosingDate, reducedEarlyRate: req.body.reducedEarlyRate ?? row.EARLY_WITHDRAWAL_RATE ?? row.ANNUAL_PROFIT_RATE, penaltyPercentage: req.body.penaltyPercentage ?? 0 }); res.json({ certificateNumber: row.CERTIFICATE_NUMBER, preview, warning: preview.warning, message: "Preview only; no certificate, account, or ledger state changed." }); }); } catch (error) { next(error); }
}

module.exports = { listSchemes, createScheme, updateScheme, calculate, createQuote, listQuotes, reminders, earlyPreview, schemeFromRow, categorizeReminders };
