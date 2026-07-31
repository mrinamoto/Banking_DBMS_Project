import { useEffect, useMemo, useState } from "react";
import api, { messageFrom } from "../services/api";
import { Empty, ErrorBox, Loading, Modal, money, PageHeader, Receipt, Status } from "../components/UI";
import { useAuth } from "../context/AuthContext";

export default function Loans() {
  const { user } = useAuth();
  const [rows, setRows] = useState(null);
  const [lookups, setLookups] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [application, setApplication] = useState({ customerId: user.customerId || "", loanTypeId: "", accountId: "", amount: "", termMonths: "" });
  const [decision, setDecision] = useState({ approvedAmount: "", reason: "" });
  const [payment, setPayment] = useState({ accountNumber: "", amount: "" });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]); const [productDialog, setProductDialog] = useState(false); const [productForm, setProductForm] = useState({ typeName: "", shortDescription: "", minAmount: "", maxAmount: "", annualInterestRate: "", minTermMonths: "", maxTermMonths: "" });

  async function load() {
    try {
      const results = await Promise.allSettled([api.get("/loans"), api.get("/lookups"), api.get("/accounts", { params: { pageSize: 100 } }), api.get("/loan-products")]);
      if (results[0].status === "fulfilled") setRows(results[0].value.data); else setError(messageFrom(results[0].reason));
      if (results[1].status === "fulfilled") setLookups(results[1].value.data); else setError(messageFrom(results[1].reason));
      if (results[2].status === "fulfilled") setAccounts(results[2].value.data.items || []); else setError(messageFrom(results[2].reason));
      if (results[3].status === "fulfilled") setProducts(results[3].value.data || []);
    } catch (requestError) { setError(messageFrom(requestError)); }
    finally { setInitialLoading(false); }
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const estimatedEmi = useMemo(() => {
    const principal = Number(decision.approvedAmount || selectedLoan?.REQUESTED_AMOUNT || 0);
    const months = Number(selectedLoan?.TERM_MONTHS || 0);
    const annualRate = Number(selectedLoan?.INTEREST_RATE || 0);
    if (!principal || !months) return 0;
    if (!annualRate) return principal / months;
    const rate = annualRate / 1200;
    return principal * rate * (1 + rate) ** months / ((1 + rate) ** months - 1);
  }, [decision.approvedAmount, selectedLoan]);

  const eligibleApplicationAccounts = accounts.filter((account) => account.STATUS === "ACTIVE");
  const eligiblePaymentAccounts = accounts.filter((account) => selectedLoan && Number(account.CUSTOMER_ID) === Number(selectedLoan.CUSTOMER_ID) && account.STATUS === "ACTIVE");

  async function apply(event) {
    event.preventDefault();setBusy(true);
    try { await api.post("/loans", application);setDialog(null);await load(); }
    catch (requestError) { setError(messageFrom(requestError)); }
    finally { setBusy(false); }
  }

  async function decide(event, action) {
    event.preventDefault();setBusy(true);
    try {
      const body = action === "APPROVE" ? { decision: action, approvedAmount: Number(decision.approvedAmount) } : { decision: action, reason: decision.reason };
      const result = await api.post(`/loans/${selectedLoan.LOAN_ID}/decision`, body);
      setReceipt(result.data.reference ? { ...result.data, type: "LOAN DISBURSEMENT", amount: decision.approvedAmount, status: "SUCCESS" } : null);
      setDialog(null);await load();
    } catch (requestError) { setError(messageFrom(requestError)); }
    finally { setBusy(false); }
  }

  async function pay(event) {
    event.preventDefault();setBusy(true);
    try { const result = await api.post(`/loans/${selectedLoan.LOAN_ID}/payments`, payment);setReceipt(result.data);setDialog(null);setPayment({ accountNumber: "", amount: "" });await load(); }
    catch (requestError) { setError(messageFrom(requestError)); }
    finally { setBusy(false); }
  }

  async function showHistory(loan) {
    setSelectedLoan(loan);
    try { setHistory((await api.get(`/loans/${loan.LOAN_ID}/payments`)).data);setDialog("history"); }
    catch (requestError) { setError(messageFrom(requestError)); }
  }
  async function createProduct(event) { event.preventDefault(); if (busy) return; setBusy(true); try { await api.post("/loan-products", productForm); setProductDialog(false); setProductForm({ typeName: "", shortDescription: "", minAmount: "", maxAmount: "", annualInterestRate: "", minTermMonths: "", maxTermMonths: "" }); await load(); } catch (e) { setError(messageFrom(e)); } finally { setBusy(false); } }
  async function toggleProduct(product) { if (busy) return; setBusy(true); try { await api.patch(`/loan-products/${product.LOAN_TYPE_ID}/status`, { status: product.STATUS === "ACTIVE" ? "INACTIVE" : "ACTIVE" }); await load(); } catch (e) { setError(messageFrom(e)); } finally { setBusy(false); } }

  if (initialLoading) return <Loading />;
  return <>
    <PageHeader title="Loans" subtitle="Oracle validates limits, EMI, disbursement, ownership, and repayment" action={<div className="flex gap-2">{user.role === "ADMIN" && <button className="btn-secondary" onClick={() => setProductDialog(true)}>Add product</button>}<button className="btn-primary" onClick={() => setDialog("apply")}>Apply for loan</button></div>} />
    <ErrorBox message={error} />
    {lookups?.loanTypes?.length > 0 && <section className="mb-5 grid gap-4 md:grid-cols-2"><h2 className="sr-only">Loan product catalogue</h2>{lookups.loanTypes.map((product) => <article className="card" key={product.ID}><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">{product.LABEL}</h2><p className="mt-1 text-sm text-slate-600">{product.SHORT_DESCRIPTION || "Educational lending product"}</p></div><Status value="ACTIVE" /></div><p className="mt-3 text-sm">{product.DETAILED_DESCRIPTION || "Final approval, pricing and eligibility are determined by Oracle-backed review."}</p><dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600"><div><dt>Amount</dt><dd className="font-semibold">{money(product.MIN_AMOUNT)}–{money(product.MAX_AMOUNT)}</dd></div><div><dt>Rate</dt><dd className="font-semibold">{product.ANNUAL_INTEREST_RATE}% · {product.INTEREST_METHOD || "REDUCING_BALANCE"}</dd></div><div><dt>Term</dt><dd className="font-semibold">{product.MIN_TERM_MONTHS}–{product.MAX_TERM_MONTHS} months</dd></div><div><dt>Processing fee</dt><dd className="font-semibold">{product.PROCESSING_FEE_PERCENTAGE || 0}%</dd></div></dl><p className="mt-3 text-xs text-slate-500">{product.ELIGIBILITY_SUMMARY || "Eligibility is checked by the server."}</p><button className="mt-3 text-sm text-emerald-700" onClick={() => setSelectedProduct(product)}>View details and documents</button></article>)}</section>}
    <Receipt data={receipt} title="Loan transaction receipt" />
    {!rows?.length ? <Empty /> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Loan</th><th>Customer</th><th>Type</th><th>Requested</th><th>EMI</th><th>Outstanding</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map((loan) => <tr key={loan.LOAN_ID}><td className="font-mono">{loan.LOAN_NUMBER}</td><td>{loan.CUSTOMER_NAME}</td><td>{loan.TYPE_NAME}</td><td>{money(loan.REQUESTED_AMOUNT)}</td><td>{money(loan.MONTHLY_INSTALLMENT)}</td><td>{money(loan.OUTSTANDING_BALANCE)}</td><td><Status value={loan.STATUS} /></td><td><div className="flex gap-2">{loan.STATUS === "PENDING" && ["ADMIN", "MANAGER"].includes(user.role) && <><button className="text-emerald-700" onClick={() => { setSelectedLoan(loan);setDecision({ approvedAmount: loan.REQUESTED_AMOUNT, reason: "" });setDialog("approve"); }}>Approve</button><button className="text-red-700" onClick={() => { setSelectedLoan(loan);setDialog("reject"); }}>Reject</button></>}{loan.STATUS === "ACTIVE" && <button className="text-emerald-700" onClick={() => { setSelectedLoan(loan);setPayment({ accountNumber: "", amount: "" });setDialog("pay"); }}>Pay loan</button>}<button className="text-blue-700" onClick={() => showHistory(loan)}>History</button></div></td></tr>)}</tbody></table></div>}

    {dialog === "apply" && <Modal title="New loan application" onClose={() => setDialog(null)}><form onSubmit={apply} className="space-y-4"><label className="field">Loan type<select required value={application.loanTypeId} onChange={(event) => setApplication({ ...application, loanTypeId: event.target.value })}><option value="">Select</option>{lookups?.loanTypes.map((item) => <option key={item.ID} value={item.ID}>{item.LABEL} · {item.ANNUAL_INTEREST_RATE}% · {money(item.MIN_AMOUNT)}–{money(item.MAX_AMOUNT)}</option>)}</select></label><label className="field">Customer and eligible account<select required value={application.accountId} onChange={(event) => { const account=accounts.find((item)=>Number(item.ACCOUNT_ID)===Number(event.target.value));setApplication({ ...application, accountId: event.target.value, customerId: account?.CUSTOMER_ID || "" }); }}><option value="">Select account</option>{eligibleApplicationAccounts.map((account) => <option key={account.ACCOUNT_ID} value={account.ACCOUNT_ID}>{account.CUSTOMER_NAME} · {account.ACCOUNT_NUMBER} · {account.TYPE_NAME} · available {money(account.AVAILABLE_BALANCE)} · {account.BRANCH_NAME}</option>)}</select></label><label className="field">Requested amount<input type="number" min="1" required value={application.amount} onChange={(event) => setApplication({ ...application, amount: event.target.value })} /></label><label className="field">Term (months)<input type="number" min="1" required value={application.termMonths} onChange={(event) => setApplication({ ...application, termMonths: event.target.value })} /></label><button className="btn-primary" disabled={busy}>{busy ? "Submitting…" : "Submit application"}</button></form></Modal>}
    {dialog === "approve" && <Modal title="Approve and disburse loan" onClose={() => setDialog(null)}><form onSubmit={(event) => decide(event, "APPROVE")} className="space-y-4"><p>Requested: <b>{money(selectedLoan.REQUESTED_AMOUNT)}</b> · Term: <b>{selectedLoan.TERM_MONTHS} months</b></p><label className="field">Approved amount<input type="number" min="0.01" max={selectedLoan.REQUESTED_AMOUNT} step="0.01" required value={decision.approvedAmount} onChange={(event) => setDecision({ ...decision, approvedAmount: event.target.value })} /></label><p className="rounded-lg bg-slate-50 p-3 text-sm">Estimated EMI: <b>{money(estimatedEmi)}</b>. Oracle recalculates and is authoritative.</p><button className="btn-primary" disabled={busy}>{busy ? "Approving…" : "Confirm approval"}</button></form></Modal>}
    {dialog === "reject" && <Modal title="Reject loan" onClose={() => setDialog(null)}><form onSubmit={(event) => decide(event, "REJECT")} className="space-y-4"><label className="field">Rejection reason<textarea rows="4" required value={decision.reason} onChange={(event) => setDecision({ ...decision, reason: event.target.value })} /></label><button className="btn-primary" disabled={busy}>{busy ? "Rejecting…" : "Confirm rejection"}</button></form></Modal>}
    {dialog === "pay" && <Modal title="Pay active loan" onClose={() => setDialog(null)}><form onSubmit={pay} className="space-y-4"><p>Current outstanding: <b>{money(selectedLoan.OUTSTANDING_BALANCE)}</b></p><label className="field">Owned eligible account<select required value={payment.accountNumber} onChange={(event) => setPayment({ ...payment, accountNumber: event.target.value })}><option value="">Select account</option>{eligiblePaymentAccounts.map((account) => <option key={account.ACCOUNT_ID} value={account.ACCOUNT_NUMBER}>{account.ACCOUNT_NUMBER} · available {money(account.AVAILABLE_BALANCE)}</option>)}</select></label><label className="field">Payment amount<input type="number" min="0.01" max={selectedLoan.OUTSTANDING_BALANCE} step="0.01" required value={payment.amount} onChange={(event) => setPayment({ ...payment, amount: event.target.value })} /></label><button className="btn-primary" disabled={busy}>{busy ? "Processing…" : "Confirm payment"}</button></form></Modal>}
    {dialog === "history" && <Modal title={`Payments · ${selectedLoan.LOAN_NUMBER}`} onClose={() => setDialog(null)}>{!history.length ? <Empty text="No payments recorded." /> : <div className="space-y-3">{history.map((item) => <div className="rounded-lg border p-3" key={item.PAYMENT_ID}><div className="flex justify-between"><b>{money(item.AMOUNT)}</b><span>{new Date(item.PAYMENT_DATE).toLocaleString()}</span></div><p className="text-sm text-slate-500">{item.REFERENCE_NO} · {item.ACCOUNT_NUMBER} · outstanding {money(item.NEW_OUTSTANDING)}</p></div>)}</div>}</Modal>}
    {selectedProduct && <Modal title={`${selectedProduct.LABEL} details`} onClose={() => setSelectedProduct(null)}><div className="space-y-3 text-sm"><p>{selectedProduct.DETAILED_DESCRIPTION || selectedProduct.SHORT_DESCRIPTION}</p><p><b>Eligibility:</b> {selectedProduct.ELIGIBILITY_SUMMARY || "Server-side eligibility review applies."}</p><p><b>Required documents:</b> {selectedProduct.REQUIRED_DOCUMENT_SUMMARY || "DEMO identity and supporting income documentation."}</p><p><b>Processing fee:</b> {selectedProduct.PROCESSING_FEE_PERCENTAGE || 0}% of approved amount.</p><p className="text-xs text-slate-500">Educational catalogue only. Oracle approval, pricing and repayment calculations are authoritative.</p></div></Modal>}
    {user.role === "ADMIN" && products.length > 0 && <section className="card mt-5"><h2 className="mb-3 font-semibold">Admin product controls</h2><div className="space-y-2">{products.map((product) => <div className="flex flex-wrap items-center justify-between gap-2 border-b py-2 last:border-0" key={product.LOAN_TYPE_ID}><span>{product.TYPE_NAME} <Status value={product.STATUS} /></span><button className="text-sm text-amber-700" disabled={busy} onClick={() => toggleProduct(product)}>{product.STATUS === "ACTIVE" ? "Deactivate" : "Activate"}</button></div>)}</div></section>}
    {productDialog && <Modal title="Create loan product" onClose={() => !busy && setProductDialog(false)}><form className="grid gap-3 sm:grid-cols-2" onSubmit={createProduct}>{[["typeName","Name"],["shortDescription","Short description"],["minAmount","Minimum amount"],["maxAmount","Maximum amount"],["annualInterestRate","Annual rate"],["minTermMonths","Minimum term"],["maxTermMonths","Maximum term"]].map(([key,label]) => <label className="field" key={key}>{label}<input required value={productForm[key]} type={key.includes("Amount") || key.includes("Rate") || key.includes("Term") ? "number" : "text"} onChange={(e) => setProductForm({ ...productForm, [key]: e.target.value })} /></label>)}<button className="btn-primary sm:col-span-2" disabled={busy}>{busy ? "Saving…" : "Create product"}</button></form></Modal>}
  </>;
}
