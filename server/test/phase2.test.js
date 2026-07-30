const test = require("node:test");
const assert = require("node:assert/strict");
const { dateRange, summarizeStatement, assertSupportedReversal, assertBeneficiaryAccounts, validateKycDecision } = require("../controllers/customerToolsController");
const { verifyPassword, hashPassword } = require("../utils/passwords");

test("only deposit and withdrawal transactions are reversible", () => {
  assert.doesNotThrow(() => assertSupportedReversal("DEPOSIT"));
  assert.doesNotThrow(() => assertSupportedReversal("WITHDRAWAL"));
  for (const type of ["TRANSFER_DEBIT", "TRANSFER_CREDIT", "LOAN_PAYMENT"]) assert.throws(() => assertSupportedReversal(type), (error) => error.status === 400);
});

test("statement date validation rejects reversed and malformed ranges", () => {
  assert.deepEqual(dateRange({ from: "2026-01-01", to: "2026-01-31" }), { from: "2026-01-01", to: "2026-01-31" });
  assert.throws(() => dateRange({ from: "2026-02-01", to: "2026-01-31" }), (error) => error.status === 400);
  assert.throws(() => dateRange({ from: "01/01/2026", to: "2026-01-31" }), (error) => error.status === 400);
});

test("statement totals use stored running balances", () => {
  const summary = summarizeStatement(100, [{ CREDIT: 25, DEBIT: 0, RUNNING_BALANCE: 125 }, { CREDIT: 0, DEBIT: 10, RUNNING_BALANCE: 115 }]);
  assert.deepEqual(summary, { openingBalance: 100, closingBalance: 115, totalCredit: 25, totalDebit: 10, transactionCount: 2 });
  assert.deepEqual(summarizeStatement(100, []), { openingBalance: 100, closingBalance: 100, totalCredit: 0, totalDebit: 0, transactionCount: 0 });
});

test("password change uses the existing scrypt verifier", async () => {
  const hash = await hashPassword("phase-two-password");
  assert.equal(await verifyPassword("phase-two-password", hash), true);
  assert.equal(await verifyPassword("wrong-password", hash), false);
});

test("beneficiary and KYC rules reject unsafe inputs", () => {
  assert.throws(() => assertBeneficiaryAccounts(10, 10), (error) => error.status === 400);
  assert.doesNotThrow(() => assertBeneficiaryAccounts(10, 11));
  assert.equal(validateKycDecision("VERIFIED"), "VERIFIED");
  assert.throws(() => validateKycDecision("REJECTED", ""), (error) => error.status === 400);
});
