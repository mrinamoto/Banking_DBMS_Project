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
  const [application, setApplication] = useState({ customerId: user.customerId || "", loanTypeId: "", accountId: "", amount: "", termMonths: "" });
  const [decision, setDecision] = useState({ approvedAmount: "", reason: "" });
  const [payment, setPayment] = useState({ accountNumber: "", amount: "" });

  async function load() {
    try {
      const [loanResult, lookupResult, accountResult] = await Promise.all([
        api.get("/loans"), api.get("/lookups"), api.get("/accounts", { params: { pageSize: 100 } }),
      ]);
      setRows(loanResult.data);
      setLookups(lookupResult.data);
      setAccounts(accountResult.data.items);
      setError("");
    } catch (requestError) { setError(messageFrom(requestError)); }
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

  if (!rows && !error) return <Loading />;
  return <>
    <PageHeader title="Loans" subtitle="Oracle validates limits, EMI, disbursement, ownership, and repayment" action={<button className="btn-primary" onClick={() => setDialog("apply")}>Apply for loan</button>} />
    <ErrorBox message={error} />
    <Receipt data={receipt} title="Loan transaction receipt" />
    {!rows?.length ? <Empty /> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Loan</th><th>Customer</th><th>Type</th><th>Requested</th><th>EMI</th><th>Outstanding</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map((loan) => <tr key={loan.LOAN_ID}><td className="font-mono">{loan.LOAN_NUMBER}</td><td>{loan.CUSTOMER_NAME}</td><td>{loan.TYPE_NAME}</td><td>{money(loan.REQUESTED_AMOUNT)}</td><td>{money(loan.MONTHLY_INSTALLMENT)}</td><td>{money(loan.OUTSTANDING_BALANCE)}</td><td><Status value={loan.STATUS} /></td><td><div className="flex gap-2">{loan.STATUS === "PENDING" && ["ADMIN", "MANAGER"].includes(user.role) && <><button className="text-emerald-700" onClick={() => { setSelectedLoan(loan);setDecision({ approvedAmount: loan.REQUESTED_AMOUNT, reason: "" });setDialog("approve"); }}>Approve</button><button className="text-red-700" onClick={() => { setSelectedLoan(loan);setDialog("reject"); }}>Reject</button></>}{loan.STATUS === "ACTIVE" && <button className="text-emerald-700" onClick={() => { setSelectedLoan(loan);setPayment({ accountNumber: "", amount: "" });setDialog("pay"); }}>Pay loan</button>}<button className="text-blue-700" onClick={() => showHistory(loan)}>History</button></div></td></tr>)}</tbody></table></div>}

    {dialog === "apply" && <Modal title="New loan application" onClose={() => setDialog(null)}><form onSubmit={apply} className="space-y-4"><label className="field">Loan type<select required value={application.loanTypeId} onChange={(event) => setApplication({ ...application, loanTypeId: event.target.value })}><option value="">Select</option>{lookups?.loanTypes.map((item) => <option key={item.ID} value={item.ID}>{item.LABEL} · {item.ANNUAL_INTEREST_RATE}% · {money(item.MIN_AMOUNT)}–{money(item.MAX_AMOUNT)}</option>)}</select></label><label className="field">Customer and eligible account<select required value={application.accountId} onChange={(event) => { const account=accounts.find((item)=>Number(item.ACCOUNT_ID)===Number(event.target.value));setApplication({ ...application, accountId: event.target.value, customerId: account?.CUSTOMER_ID || "" }); }}><option value="">Select account</option>{eligibleApplicationAccounts.map((account) => <option key={account.ACCOUNT_ID} value={account.ACCOUNT_ID}>{account.CUSTOMER_NAME} · {account.ACCOUNT_NUMBER} · {account.TYPE_NAME} · available {money(account.AVAILABLE_BALANCE)} · {account.BRANCH_NAME}</option>)}</select></label><label className="field">Requested amount<input type="number" min="1" required value={application.amount} onChange={(event) => setApplication({ ...application, amount: event.target.value })} /></label><label className="field">Term (months)<input type="number" min="1" required value={application.termMonths} onChange={(event) => setApplication({ ...application, termMonths: event.target.value })} /></label><button className="btn-primary" disabled={busy}>{busy ? "Submitting…" : "Submit application"}</button></form></Modal>}
    {dialog === "approve" && <Modal title="Approve and disburse loan" onClose={() => setDialog(null)}><form onSubmit={(event) => decide(event, "APPROVE")} className="space-y-4"><p>Requested: <b>{money(selectedLoan.REQUESTED_AMOUNT)}</b> · Term: <b>{selectedLoan.TERM_MONTHS} months</b></p><label className="field">Approved amount<input type="number" min="0.01" max={selectedLoan.REQUESTED_AMOUNT} step="0.01" required value={decision.approvedAmount} onChange={(event) => setDecision({ ...decision, approvedAmount: event.target.value })} /></label><p className="rounded-lg bg-slate-50 p-3 text-sm">Estimated EMI: <b>{money(estimatedEmi)}</b>. Oracle recalculates and is authoritative.</p><button className="btn-primary" disabled={busy}>{busy ? "Approving…" : "Confirm approval"}</button></form></Modal>}
    {dialog === "reject" && <Modal title="Reject loan" onClose={() => setDialog(null)}><form onSubmit={(event) => decide(event, "REJECT")} className="space-y-4"><label className="field">Rejection reason<textarea rows="4" required value={decision.reason} onChange={(event) => setDecision({ ...decision, reason: event.target.value })} /></label><button className="btn-primary" disabled={busy}>{busy ? "Rejecting…" : "Confirm rejection"}</button></form></Modal>}
    {dialog === "pay" && <Modal title="Pay active loan" onClose={() => setDialog(null)}><form onSubmit={pay} className="space-y-4"><p>Current outstanding: <b>{money(selectedLoan.OUTSTANDING_BALANCE)}</b></p><label className="field">Owned eligible account<select required value={payment.accountNumber} onChange={(event) => setPayment({ ...payment, accountNumber: event.target.value })}><option value="">Select account</option>{eligiblePaymentAccounts.map((account) => <option key={account.ACCOUNT_ID} value={account.ACCOUNT_NUMBER}>{account.ACCOUNT_NUMBER} · available {money(account.AVAILABLE_BALANCE)}</option>)}</select></label><label className="field">Payment amount<input type="number" min="0.01" max={selectedLoan.OUTSTANDING_BALANCE} step="0.01" required value={payment.amount} onChange={(event) => setPayment({ ...payment, amount: event.target.value })} /></label><button className="btn-primary" disabled={busy}>{busy ? "Processing…" : "Confirm payment"}</button></form></Modal>}
    {dialog === "history" && <Modal title={`Payments · ${selectedLoan.LOAN_NUMBER}`} onClose={() => setDialog(null)}>{!history.length ? <Empty text="No payments recorded." /> : <div className="space-y-3">{history.map((item) => <div className="rounded-lg border p-3" key={item.PAYMENT_ID}><div className="flex justify-between"><b>{money(item.AMOUNT)}</b><span>{new Date(item.PAYMENT_DATE).toLocaleString()}</span></div><p className="text-sm text-slate-500">{item.REFERENCE_NO} · {item.ACCOUNT_NUMBER} · outstanding {money(item.NEW_OUTSTANDING)}</p></div>)}</div>}</Modal>}
  </>;
}
