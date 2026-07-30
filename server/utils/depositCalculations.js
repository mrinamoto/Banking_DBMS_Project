const SUPPORTED_DURATIONS = [3, 6, 12, 24, 36];

function validationError(message) { const error = new Error(message); error.status = 400; return error; }
function roundMoney(value) { return Math.round((Number(value) + Number.EPSILON) * 100) / 100; }
function parseDate(value) {
  const text = String(value || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw validationError("Opening date must use YYYY-MM-DD.");
  const [year, month, day] = text.split("-").map(Number); const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) throw validationError("Opening date is not a real calendar date.");
  return date;
}
function isoDate(date) { return date.toISOString().slice(0, 10); }
function addMonths(value, months) { const date = parseDate(value); const originalDay = date.getUTCDate(); date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() + Number(months)); const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate(); date.setUTCDate(Math.min(originalDay, lastDay)); return isoDate(date); }

function validateInputs(input, scheme = {}) {
  const principal = Number(input.principalAmount);
  const durationMonths = Number(input.durationMonths);
  const annualRate = Number(input.annualProfitRate);
  const taxPercentage = Number(input.taxPercentage ?? 0);
  if (!Number.isFinite(principal) || principal <= 0) throw validationError("Deposit amount must be greater than zero.");
  if (!SUPPORTED_DURATIONS.includes(durationMonths)) throw validationError("Duration must be 3, 6, 12, 24, or 36 months.");
  if (!Number.isFinite(annualRate) || annualRate < 0 || annualRate > 100) throw validationError("Annual profit rate must be between 0 and 100.");
  if (!Number.isFinite(taxPercentage) || taxPercentage < 0 || taxPercentage > 100) throw validationError("Tax percentage must be between 0 and 100.");
  if (scheme.minimumAmount != null && principal < Number(scheme.minimumAmount)) throw validationError(`Amount must be at least ${roundMoney(scheme.minimumAmount)} BDT for this scheme.`);
  if (scheme.maximumAmount != null && principal > Number(scheme.maximumAmount)) throw validationError("Amount exceeds this scheme's maximum.");
  if (scheme.minimumMonths != null && durationMonths < Number(scheme.minimumMonths)) throw validationError("Duration is below this scheme's minimum term.");
  if (scheme.maximumMonths != null && durationMonths > Number(scheme.maximumMonths)) throw validationError("Duration exceeds this scheme's maximum term.");
  const openingDate = parseDate(input.openingDate);
  return { principal, durationMonths, annualRate, taxPercentage, openingDate: isoDate(openingDate), calculationMethod: input.calculationMethod === "MONTHLY_COMPOUND" ? "MONTHLY_COMPOUND" : "SIMPLE" };
}

function calculateDeposit(input, scheme = {}) {
  const values = validateInputs(input, scheme);
  const rate = values.annualRate / 100; const taxRate = values.taxPercentage / 100; const months = values.durationMonths;
  const grossMaturity = values.calculationMethod === "MONTHLY_COMPOUND" ? values.principal * Math.pow(1 + rate / 12, months) : values.principal * (1 + rate * (months / 12));
  const grossProfit = grossMaturity - values.principal; const totalTax = grossProfit * taxRate; const netProfit = grossProfit - totalTax;
  return { ...values, monthlyGrossProfit: roundMoney(grossProfit / months), monthlyTax: roundMoney(totalTax / months), monthlyNetProfit: roundMoney(netProfit / months), totalGrossProfit: roundMoney(grossProfit), totalTax: roundMoney(totalTax), totalNetProfit: roundMoney(netProfit), maturityAmount: roundMoney(values.principal + netProfit), maturityDate: addMonths(values.openingDate, months), disclaimer: "Educational demonstration estimate only; not a banking offer." };
}

function calculateDps(input, scheme = {}) {
  const monthlyContribution = Number(input.monthlyContribution ?? input.principalAmount);
  if (!Number.isFinite(monthlyContribution) || monthlyContribution <= 0) throw validationError("Monthly contribution must be greater than zero.");
  const result = validateInputs({ ...input, principalAmount: monthlyContribution }, { ...scheme, minimumAmount: null, maximumAmount: null });
  const monthlyRate = result.annualRate / 100 / 12; const periods = result.durationMonths;
  const maturityBeforeTax = monthlyRate === 0 ? monthlyContribution * periods : monthlyContribution * ((Math.pow(1 + monthlyRate, periods) - 1) / monthlyRate);
  const totalContributed = monthlyContribution * periods; const grossProfit = maturityBeforeTax - totalContributed; const totalTax = grossProfit * (result.taxPercentage / 100); const netProfit = grossProfit - totalTax;
  return { ...result, monthlyContribution: roundMoney(monthlyContribution), totalContributed: roundMoney(totalContributed), monthlyGrossProfit: roundMoney(grossProfit / periods), monthlyTax: roundMoney(totalTax / periods), monthlyNetProfit: roundMoney(netProfit / periods), totalGrossProfit: roundMoney(grossProfit), totalTax: roundMoney(totalTax), totalNetProfit: roundMoney(netProfit), maturityAmount: roundMoney(totalContributed + netProfit), maturityDate: addMonths(result.openingDate, periods), contributionTiming: "Assumes each contribution is made at the end of its month.", disclaimer: "Educational DPS approximation only; not a banking offer." };
}

function earlyWithdrawalPreview(input) {
  const original = calculateDeposit(input, { minimumAmount: null, maximumAmount: null });
  const closingDate = parseDate(input.requestedClosingDate); const opening = parseDate(original.openingDate); if (closingDate < opening) throw validationError("Closing date cannot be before opening date."); const elapsedMonths = Math.max(0, Math.min(original.durationMonths, (closingDate.getUTCFullYear() - opening.getUTCFullYear()) * 12 + closingDate.getUTCMonth() - opening.getUTCMonth()));
  const reducedRate = Number(input.reducedEarlyRate ?? original.annualRate); const penaltyPercentage = Number(input.penaltyPercentage ?? 0); if (!Number.isFinite(reducedRate) || reducedRate < 0 || reducedRate > 100 || !Number.isFinite(penaltyPercentage) || penaltyPercentage < 0 || penaltyPercentage > 100) throw validationError("Early-withdrawal rate and penalty must be between 0 and 100.");
  const elapsed = elapsedMonths;
  const reducedRateDecimal = reducedRate / 100;
  const reducedGrossMaturity = elapsed === 0 ? original.principal : input.calculationMethod === "MONTHLY_COMPOUND" ? original.principal * Math.pow(1 + reducedRateDecimal / 12, elapsed) : original.principal * (1 + reducedRateDecimal * (elapsed / 12));
  const reducedGrossProfit = reducedGrossMaturity - original.principal;
  const reducedTax = reducedGrossProfit * (original.taxPercentage / 100);
  const reduced = { totalNetProfit: reducedGrossProfit - reducedTax, totalTax: reducedTax };
  const penalty = original.principal * (penaltyPercentage / 100); const finalPayable = Math.max(0, original.principal + reduced.totalNetProfit - penalty);
  return { originalExpectedProfit: original.totalNetProfit, reducedEarnedProfit: reduced.totalNetProfit, penalty: roundMoney(penalty), tax: reduced.totalTax, finalEstimatedPayable: roundMoney(finalPayable), lostProfit: roundMoney(Math.max(0, original.totalNetProfit - reduced.totalNetProfit)), earnedMonths: elapsedMonths, warning: `Closing this deposit early will reduce expected profit by ${roundMoney(Math.max(0, original.totalNetProfit - reduced.totalNetProfit))} BDT.` };
}

module.exports = { SUPPORTED_DURATIONS, roundMoney, parseDate, addMonths, calculateDeposit, calculateDps, earlyWithdrawalPreview, validateInputs };
