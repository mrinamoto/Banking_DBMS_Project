import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Calculator, Download, Landmark, Printer, RefreshCw, X } from "lucide-react";
import api, { messageFrom } from "../services/api";
import { Empty, ErrorBox, Loading, PageHeader, Status, money } from "../components/UI";
import { useAuth } from "../context/AuthContext";

const durations = [3, 6, 12, 24, 36];
const today = () => new Date().toISOString().slice(0, 10);
const blankScheme = { schemeCode: "", schemeName: "", schemeType: "FIXED_DEPOSIT", minimumAmount: 1000, minimumMonths: 3, maximumMonths: 36, annualProfitRate: 8, calculationMethod: "SIMPLE", paymentFrequency: "AT_MATURITY", taxPercentage: 0, earlyWithdrawalRate: 3 };
const initialForm = () => ({ schemeId: "", principalAmount: "10000", monthlyContribution: "1000", durationMonths: 12, openingDate: today(), annualProfitRate: "", taxPercentage: "", calculationMethod: "" });

function SectionLoading({ label }) { return <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500" role="status">Loading {label}…</div>; }
function SectionError({ message, onRetry }) { return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert"><p>{message}</p><button className="btn-secondary mt-3" onClick={onRetry}>Retry</button></div>; }

export default function DepositSuite() {
  const { user } = useAuth();
  const mounted = useRef(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [schemes, setSchemes] = useState([]); const [quotes, setQuotes] = useState([]); const [reminders, setReminders] = useState(null);
  const [schemesLoading, setSchemesLoading] = useState(false); const [quotesLoading, setQuotesLoading] = useState(false); const [remindersLoading, setRemindersLoading] = useState(false);
  const [schemesError, setSchemesError] = useState(""); const [quotesError, setQuotesError] = useState(""); const [remindersError, setRemindersError] = useState(""); const [formError, setFormError] = useState(""); const [successNotice, setSuccessNotice] = useState("");
  const [result, setResult] = useState(null); const [preview, setPreview] = useState(null); const [previewForm, setPreviewForm] = useState({ requestedClosingDate: today(), penaltyPercentage: "0" });
  const [calculating, setCalculating] = useState(false); const [savingQuote, setSavingQuote] = useState(false); const [previewLoading, setPreviewLoading] = useState(false); const [schemeSaving, setSchemeSaving] = useState(false); const [deactivatingId, setDeactivatingId] = useState(null);
  const [schemeForm, setSchemeForm] = useState(blankScheme); const [form, setForm] = useState(initialForm);
  const selected = useMemo(() => schemes.find((item) => String(item.schemeId) === String(form.schemeId)), [schemes, form.schemeId]);
  const activeSchemes = useMemo(() => schemes.filter((scheme) => scheme.status === "ACTIVE"), [schemes]);

  const loadSchemes = useCallback(async () => {
    if (!mounted.current) return;
    setSchemesLoading(true); setSchemesError("");
    try { const response = await api.get("/deposit-schemes"); if (!mounted.current) return; setSchemes(response.data); setForm((current) => current.schemeId || !response.data[0] ? current : { ...current, schemeId: response.data[0].schemeId }); }
    catch (requestError) { if (mounted.current) setSchemesError(messageFrom(requestError)); }
    finally { if (mounted.current) setSchemesLoading(false); }
  }, []);
  const loadQuotes = useCallback(async () => {
    if (!mounted.current) return;
    setQuotesLoading(true); setQuotesError("");
    try { const response = await api.get("/deposit-quotes", { params: { pageSize: 100 } }); if (mounted.current) setQuotes(response.data.items || []); }
    catch (requestError) { if (mounted.current) setQuotesError(messageFrom(requestError)); }
    finally { if (mounted.current) setQuotesLoading(false); }
  }, []);
  const loadReminders = useCallback(async () => {
    if (!mounted.current) return;
    setRemindersLoading(true); setRemindersError("");
    try { const response = await api.get("/deposit-reminders"); if (mounted.current) setReminders(response.data); }
    catch (requestError) { if (mounted.current) setRemindersError(messageFrom(requestError)); }
    finally { if (mounted.current) setRemindersLoading(false); }
  }, []);
  const refreshAll = useCallback(async () => {
    await Promise.allSettled([loadSchemes(), loadQuotes(), loadReminders()]);
    if (mounted.current) setInitialLoading(false);
  }, [loadQuotes, loadReminders, loadSchemes]);
  useEffect(() => { mounted.current = true; refreshAll(); return () => { mounted.current = false; }; }, [refreshAll]);
  useEffect(() => { if (selected) setForm((current) => ({ ...current, annualProfitRate: selected.annualProfitRate, taxPercentage: selected.taxPercentage, calculationMethod: selected.calculationMethod })); }, [selected]);

  function update(name, value) { setForm((current) => ({ ...current, [name]: value })); setFormError(""); setSuccessNotice(""); }
  async function calculate(event) {
    event.preventDefault(); if (calculating || !form.schemeId) return; setCalculating(true); setFormError(""); setSuccessNotice("");
    try { const response = await api.post("/deposit-calculator", form); if (mounted.current) setResult(response.data); }
    catch (requestError) { if (mounted.current) setFormError(messageFrom(requestError)); }
    finally { if (mounted.current) setCalculating(false); }
  }
  async function saveQuote() {
    if (!result || savingQuote || user.role !== "CUSTOMER") return; setSavingQuote(true); setFormError("");
    try { const response = await api.post("/deposit-quotes", form); if (!mounted.current) return; setSuccessNotice(`${response.data.certificateNumber} saved as an educational quotation.`); setResult(response.data); await loadQuotes(); }
    catch (requestError) { if (mounted.current) setFormError(messageFrom(requestError)); }
    finally { if (mounted.current) setSavingQuote(false); }
  }
  function openPreview(certificateId) { setPreview({ certificateId }); setPreviewForm({ requestedClosingDate: today(), penaltyPercentage: "0" }); setFormError(""); }
  async function submitPreview(event) {
    event.preventDefault(); if (!preview || previewLoading) return; setPreviewLoading(true); setFormError("");
    try { const response = await api.post(`/deposit-quotes/${preview.certificateId}/early-withdrawal-preview`, previewForm); if (mounted.current) setPreview((current) => ({ ...current, response: response.data })); }
    catch (requestError) { if (mounted.current) setFormError(messageFrom(requestError)); }
    finally { if (mounted.current) setPreviewLoading(false); }
  }
  async function createScheme(event) {
    event.preventDefault(); if (schemeSaving) return; setSchemeSaving(true); setFormError("");
    try { await api.post("/deposit-schemes", schemeForm); if (!mounted.current) return; setSuccessNotice("Deposit scheme created."); setSchemeForm(blankScheme); await loadSchemes(); }
    catch (requestError) { if (mounted.current) setFormError(messageFrom(requestError)); }
    finally { if (mounted.current) setSchemeSaving(false); }
  }
  async function deactivateScheme(schemeId) {
    if (deactivatingId || !window.confirm("Deactivate this scheme for new quotations?")) return; setDeactivatingId(schemeId); setFormError("");
    try { await api.patch(`/deposit-schemes/${schemeId}`, { status: "INACTIVE" }); if (mounted.current) { setSuccessNotice("Scheme deactivated; existing quotations are unchanged."); await loadSchemes(); } }
    catch (requestError) { if (mounted.current) setFormError(messageFrom(requestError)); }
    finally { if (mounted.current) setDeactivatingId(null); }
  }

  if (initialLoading) return <Loading />;
  return <><PageHeader title="Deposit Schemes & Profit Calculator" subtitle="Educational estimates, quotations and maturity reminders. No account balance or ledger entry is created." action={<button className="btn-secondary" onClick={refreshAll} disabled={schemesLoading || quotesLoading || remindersLoading}><RefreshCw size={16} /> Refresh</button>} /><ErrorBox message={formError} />{successNotice && <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700" role="status">{successNotice}</div>}
    <section className="mb-5 grid gap-4 sm:grid-cols-4">{remindersError ? <div className="sm:col-span-4"><SectionError message={remindersError} onRetry={loadReminders} /></div> : remindersLoading ? <div className="sm:col-span-4"><SectionLoading label="maturity reminders" /></div> : [["Within 7 days", reminders?.within7Days?.length], ["This month", reminders?.thisMonth?.length], ["Already matured", reminders?.alreadyMatured?.length], ["Renewal pending", reminders?.renewalPending?.length]].map(([label, value]) => <div className="card" key={label}><span className="text-xs uppercase text-slate-500">{label}</span><strong className="mt-1 block text-2xl">{value ?? 0}</strong></div>)}</section>
     <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]"><form className="card" onSubmit={calculate}><div className="mb-4 flex items-center gap-2"><Calculator className="text-emerald-600" /><h2 className="text-lg font-bold">Calculator</h2></div>{schemesError && <SectionError message={schemesError} onRetry={loadSchemes} />}{!schemesError && <div className="grid gap-4 sm:grid-cols-2">{schemesLoading ? <div className="sm:col-span-2"><SectionLoading label="deposit schemes" /></div> : <><label className="field sm:col-span-2">Scheme<select required value={form.schemeId} onChange={(event) => update("schemeId", event.target.value)} disabled={!activeSchemes.length}><option value="">Select a scheme</option>{activeSchemes.map((scheme) => <option value={scheme.schemeId} key={scheme.schemeId}>{scheme.schemeName} ({scheme.schemeType})</option>)}</select></label>{activeSchemes.length ? <>{selected?.schemeType === "DPS" ? <label className="field">Monthly contribution<input required type="number" min="1" value={form.monthlyContribution} onChange={(event) => update("monthlyContribution", event.target.value)} /></label> : <label className="field">Principal amount<input required type="number" min="1" value={form.principalAmount} onChange={(event) => update("principalAmount", event.target.value)} /></label>}<label className="field">Duration<select value={form.durationMonths} onChange={(event) => update("durationMonths", Number(event.target.value))}>{durations.map((duration) => <option value={duration} key={duration}>{duration} months</option>)}</select></label><label className="field">Opening date<input required type="date" value={form.openingDate} onChange={(event) => update("openingDate", event.target.value)} /></label><label className="field">Annual profit rate (%)<input required type="number" step="0.01" min="0" max="100" value={form.annualProfitRate} onChange={(event) => update("annualProfitRate", event.target.value)} /></label><label className="field">Tax (%)<input required type="number" step="0.01" min="0" max="100" value={form.taxPercentage} onChange={(event) => update("taxPercentage", event.target.value)} /></label><label className="field">Method<select value={form.calculationMethod} onChange={(event) => update("calculationMethod", event.target.value)}><option value="SIMPLE">Simple</option><option value="MONTHLY_COMPOUND">Monthly compound</option></select></label></> : <div className="sm:col-span-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">No active deposit scheme is currently available. An administrator can create a scheme below.</div>}</>}</div>}<button className="btn-primary mt-5 w-full" disabled={calculating || schemesLoading || !activeSchemes.length || !form.schemeId}>{calculating ? "Calculating…" : "Calculate estimate"}</button></form>
      <section className="card"><div className="mb-4 flex items-center gap-2"><Landmark className="text-blue-600" /><h2 className="text-lg font-bold">Scheme catalogue</h2></div>{schemesError ? <SectionError message={schemesError} onRetry={loadSchemes} /> : schemesLoading ? <SectionLoading label="deposit schemes" /> : !schemes.length ? <Empty text="No active deposit scheme is currently available." /> : <div className="space-y-3">{schemes.map((scheme) => <div className="rounded-lg border border-slate-200 p-3" key={scheme.schemeId}><div className="flex items-start justify-between gap-2"><div><strong>{scheme.schemeName}</strong><p className="text-xs text-slate-500">{scheme.schemeType} · {scheme.calculationMethod} · {scheme.annualProfitRate}% annual</p></div><Status value={scheme.status} /></div><p className="mt-2 text-xs text-slate-500">{money(scheme.minimumAmount)} minimum · {scheme.minimumMonths}–{scheme.maximumMonths} months · tax {scheme.taxPercentage}%</p>{user.role === "ADMIN" && scheme.status === "ACTIVE" && <button className="mt-2 text-xs font-semibold text-red-700" onClick={() => deactivateScheme(scheme.schemeId)} disabled={deactivatingId === scheme.schemeId}>{deactivatingId === scheme.schemeId ? "Deactivating…" : "Deactivate"}</button>}</div>)}</div>}</section>
    </div>
    {result && <section className="deposit-print card mt-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold">Estimate {result.certificateNumber ? `· ${result.certificateNumber}` : ""}</h2><div className="flex gap-2"><button className="btn-secondary" onClick={() => window.print()}><Printer size={16} /> Print quote</button>{user.role === "CUSTOMER" && !result.certificateNumber && <button className="btn-primary" onClick={saveQuote} disabled={savingQuote}>{savingQuote ? "Saving…" : <><Download size={16} /> Save quotation</>}</button>}</div></div><div className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><div><span className="text-slate-500">Principal/contributions</span><strong className="block">{money(result.totalContributed ?? result.principal)}</strong></div><div><span className="text-slate-500">Gross profit</span><strong className="block">{money(result.totalGrossProfit)}</strong></div><div><span className="text-slate-500">Tax</span><strong className="block">{money(result.totalTax)}</strong></div><div><span className="text-slate-500">Net profit</span><strong className="block text-emerald-700">{money(result.totalNetProfit)}</strong></div><div><span className="text-slate-500">Expected maturity</span><strong className="block">{money(result.maturityAmount)}</strong></div><div><span className="text-slate-500">Maturity date</span><strong className="block">{result.maturityDate}</strong></div></div><p className="mt-4 text-xs text-slate-500">{result.disclaimer}</p></section>}
    <section className="card mt-5"><h2 className="mb-4 text-lg font-bold">Saved quotations & certificates</h2>{quotesError ? <SectionError message={quotesError} onRetry={loadQuotes} /> : quotesLoading ? <SectionLoading label="quotations" /> : !quotes.length ? <Empty text="No quotation records are available for your role." /> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Certificate</th><th>Scheme</th><th>Amount</th><th>Maturity</th><th>Status</th><th>Actions</th></tr></thead><tbody>{quotes.map((quote) => <tr key={quote.CERTIFICATE_ID}><td>{quote.CERTIFICATE_NUMBER}</td><td>{quote.SCHEME_NAME}</td><td>{money(quote.PRINCIPAL_AMOUNT)}</td><td>{String(quote.MATURITY_DATE).slice(0, 10)}</td><td><Status value={quote.STATUS} /></td><td><button className="text-sm font-semibold text-emerald-700" onClick={() => openPreview(quote.CERTIFICATE_ID)} disabled={previewLoading}>Early-withdrawal preview</button></td></tr>)}</tbody></table></div>}</section>
    {user.role === "ADMIN" && <form className="card mt-5" onSubmit={createScheme}><h2 className="mb-4 text-lg font-bold">Admin: create scheme</h2><div className="grid gap-4 sm:grid-cols-3">{[["schemeCode", "Code"], ["schemeName", "Name"], ["schemeType", "Type"], ["minimumAmount", "Minimum amount"], ["minimumMonths", "Minimum months"], ["maximumMonths", "Maximum months"], ["annualProfitRate", "Annual rate"], ["taxPercentage", "Tax %"], ["earlyWithdrawalRate", "Early rate"]].map(([name, label]) => <label className="field" key={name}>{label}<input required={!['taxPercentage', 'earlyWithdrawalRate'].includes(name)} type={name.includes("Amount") || name.includes("Months") || name.includes("Rate") || name.includes("Percentage") ? "number" : "text"} value={schemeForm[name]} onChange={(event) => setSchemeForm({ ...schemeForm, [name]: event.target.value })} /></label>)}<label className="field">Calculation method<select value={schemeForm.calculationMethod} onChange={(event) => setSchemeForm({ ...schemeForm, calculationMethod: event.target.value })}><option value="SIMPLE">Simple</option><option value="MONTHLY_COMPOUND">Monthly compound</option></select></label></div><button className="btn-primary mt-4" disabled={schemeSaving}>{schemeSaving ? "Creating…" : "Create scheme"}</button></form>}
    {preview && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="early-preview-title"><section className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl bg-white p-6"><div className="flex items-center justify-between"><h2 id="early-preview-title" className="text-xl font-bold">Early-withdrawal preview</h2><button className="text-slate-500" onClick={() => setPreview(null)} aria-label="Close early-withdrawal preview"><X /></button></div>{preview.response ? <><p className="mt-2 text-sm text-slate-500">{preview.response.message}</p><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">{[["Original profit", preview.response.preview.originalExpectedProfit], ["Reduced profit", preview.response.preview.reducedEarnedProfit], ["Tax", preview.response.preview.tax], ["Penalty", preview.response.preview.penalty], ["Estimated payable", preview.response.preview.finalEstimatedPayable], ["Lost profit", preview.response.preview.lostProfit]].map(([label, value]) => <div key={label}><dt className="text-slate-500">{label}</dt><dd className="font-semibold">{money(value)}</dd></div>)}</dl><p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{preview.response.warning}</p></> : <form className="mt-4 grid gap-4" onSubmit={submitPreview}><label className="field">Requested closing date<input required type="date" value={previewForm.requestedClosingDate} onChange={(event) => setPreviewForm({ ...previewForm, requestedClosingDate: event.target.value })} /></label><label className="field">Optional penalty (%)<input type="number" min="0" max="100" step="0.01" value={previewForm.penaltyPercentage} onChange={(event) => setPreviewForm({ ...previewForm, penaltyPercentage: event.target.value })} /></label><div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setPreview(null)}>Cancel</button><button className="btn-primary" disabled={previewLoading}>{previewLoading ? "Calculating…" : "Calculate preview"}</button></div></form>} {preview.response && <button className="btn-secondary mt-5" onClick={() => setPreview(null)}>Close</button>}</section></div>}
  </>;
}
