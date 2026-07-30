const test = require("node:test");
const assert = require("node:assert/strict");
const { addMonths, calculateDeposit, calculateDps, earlyWithdrawalPreview } = require("../utils/depositCalculations");
const { categorizeReminders } = require("../controllers/depositController");

test("simple profit, tax and maturity are deterministic", () => {
  const result = calculateDeposit({ principalAmount: 10000, durationMonths: 12, annualProfitRate: 8, taxPercentage: 10, calculationMethod: "SIMPLE", openingDate: "2026-01-15" });
  assert.equal(result.totalGrossProfit, 800); assert.equal(result.totalTax, 80); assert.equal(result.totalNetProfit, 720); assert.equal(result.maturityAmount, 10720); assert.equal(result.maturityDate, "2027-01-15");
});

test("monthly compound and DPS estimates use documented formulas", () => {
  const compound = calculateDeposit({ principalAmount: 10000, durationMonths: 12, annualProfitRate: 8, taxPercentage: 0, calculationMethod: "MONTHLY_COMPOUND", openingDate: "2026-01-01" });
  assert.ok(Math.abs(compound.maturityAmount - 10830) < 0.1);
  const dps = calculateDps({ monthlyContribution: 1000, durationMonths: 12, annualProfitRate: 12, taxPercentage: 0, calculationMethod: "MONTHLY_COMPOUND", openingDate: "2026-01-01" });
  assert.equal(dps.totalContributed, 12000); assert.ok(dps.maturityAmount > dps.totalContributed); assert.equal(dps.maturityDate, "2027-01-01");
});

test("calculator validates supported terms and scheme bounds", () => {
  assert.equal(addMonths("2026-01-31", 1), "2026-02-28");
  assert.throws(() => calculateDeposit({ principalAmount: 0, durationMonths: 12, annualProfitRate: 8, openingDate: "2026-01-01" }), (error) => error.status === 400);
  assert.throws(() => calculateDeposit({ principalAmount: 10000, durationMonths: 9, annualProfitRate: 8, openingDate: "2026-01-01" }), (error) => error.status === 400);
  assert.throws(() => calculateDeposit({ principalAmount: 100, durationMonths: 12, annualProfitRate: 8, openingDate: "2026-01-01" }, { minimumAmount: 1000 }), (error) => error.status === 400);
});

test("early withdrawal is a preview and reports lost profit", () => {
  const preview = earlyWithdrawalPreview({ principalAmount: 10000, durationMonths: 12, annualProfitRate: 8, taxPercentage: 10, calculationMethod: "SIMPLE", openingDate: "2026-01-01", requestedClosingDate: "2026-02-01", reducedEarlyRate: 3, penaltyPercentage: 1 });
  assert.equal(preview.earnedMonths, 1); assert.ok(preview.lostProfit > 0); assert.ok(preview.finalEstimatedPayable < 10720); assert.match(preview.warning, /reduce expected profit/i);
});

test("maturity reminders are categorized without persistence", () => {
  const now = new Date("2026-07-30T00:00:00Z");
  const result = categorizeReminders([
    { MATURITY_DATE: new Date("2026-08-02T00:00:00Z"), STATUS: "QUOTATION", SCHEME_NAME: "A", CERTIFICATE_NUMBER: "A1", EXPECTED_MATURITY_AMOUNT: 1 },
    { MATURITY_DATE: new Date("2026-07-20T00:00:00Z"), STATUS: "MATURED", SCHEME_NAME: "B", CERTIFICATE_NUMBER: "B1", EXPECTED_MATURITY_AMOUNT: 1 }
  ], now);
  assert.equal(result.within7Days.length, 1); assert.equal(result.alreadyMatured.length, 1); assert.equal(result.thisMonth.length, 1); assert.equal(result.renewalPending.length, 1);
});
