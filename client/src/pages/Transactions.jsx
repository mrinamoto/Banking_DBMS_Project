import { useEffect, useState } from "react";
import api, { messageFrom } from "../services/api";
import { Empty, ErrorBox, Loading, money, PageHeader, Pagination, Receipt, Status } from "../components/UI";
import { useAuth } from "../context/AuthContext";

const emptyOperation = { accountNumber: "", fromAccount: "", toAccount: "", amount: "" };
const emptyFilters = { search: "", type: "", status: "", dateFrom: "", dateTo: "" };

export default function Transactions() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [mode, setMode] = useState("");
  const [form, setForm] = useState(emptyOperation);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const result = await api.get("/transactions", { params: { ...appliedFilters, page } });
      setData(result.data);
      setError("");
    } catch (requestError) { setError(messageFrom(requestError)); }
  }
  useEffect(() => { load(); }, [page, appliedFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const url = mode === "transfer" ? "/transfers" : `/transactions/${mode}`;
      const body = mode === "transfer" ? { fromAccount: form.fromAccount, toAccount: form.toAccount, amount: form.amount } : { accountNumber: form.accountNumber, amount: form.amount };
      const result = await api.post(url, body);
      setReceipt(result.data);
      setMode("");
      setForm(emptyOperation);
      await load();
    } catch (requestError) { setError(messageFrom(requestError)); }
    finally { setBusy(false); }
  }

  if (!data && !error) return <Loading />;
  return <>
    <PageHeader title="Transactions" subtitle="Atomic operations and newest-first Oracle ledger" action={<div className="flex flex-wrap gap-2">{user.role !== "CUSTOMER" && ["deposit", "withdraw"].map((item) => <button key={item} className="btn-secondary capitalize" onClick={() => setMode(item)}>{item}</button>)}<button className="btn-primary" onClick={() => setMode("transfer")}>Transfer</button></div>} />
    <ErrorBox message={error} />
    <Receipt data={receipt} />
    {mode && <form className="card mb-5 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
      {mode === "transfer" ? <><label className="field">From account<input required value={form.fromAccount} onChange={(event) => setForm({ ...form, fromAccount: event.target.value })} /></label><label className="field">To account<input required value={form.toAccount} onChange={(event) => setForm({ ...form, toAccount: event.target.value })} /></label></> : <label className="field">Account number<input required value={form.accountNumber} onChange={(event) => setForm({ ...form, accountNumber: event.target.value })} /></label>}
      <label className="field">Amount<input type="number" min="0.01" step="0.01" required value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></label>
      <div className="flex gap-2"><button className="btn-primary" disabled={busy}>{busy ? "Processing…" : `Confirm ${mode}`}</button><button type="button" className="btn-secondary" onClick={() => setMode("")}>Cancel</button></div>
    </form>}
    <div className="card mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <input className="input" placeholder="Reference" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
      <select className="input" value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}><option value="">All types</option>{["DEPOSIT","WITHDRAWAL","TRANSFER_DEBIT","TRANSFER_CREDIT","LOAN_DISBURSEMENT","LOAN_PAYMENT"].map((type) => <option key={type}>{type}</option>)}</select>
      <select className="input" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">All statuses</option><option>SUCCESS</option><option>REVERSED</option></select>
      <input className="input" type="date" value={filters.dateFrom} onChange={(event) => setFilters({ ...filters, dateFrom: event.target.value })} />
      <input className="input" type="date" value={filters.dateTo} onChange={(event) => setFilters({ ...filters, dateTo: event.target.value })} />
      <div className="flex gap-2 lg:col-span-5"><button className="btn-primary" onClick={() => { setPage(1); setAppliedFilters(filters); }}>Apply filters</button><button className="btn-secondary" onClick={() => { setFilters(emptyFilters); setAppliedFilters(emptyFilters); setPage(1); }}>Clear</button></div>
    </div>
    {!data?.items.length ? <Empty /> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Reference</th><th>Type</th><th>Account</th><th>Amount</th><th>Balance after</th><th>Time</th><th>Status</th></tr></thead><tbody>{data.items.map((transaction) => <tr key={transaction.TRANSACTION_ID}><td className="font-mono text-xs">{transaction.REFERENCE_NO}</td><td>{transaction.TRANSACTION_TYPE.replaceAll("_", " ")}</td><td>••••{transaction.ACCOUNT_NUMBER.slice(-4)}</td><td>{money(transaction.AMOUNT)}</td><td>{money(transaction.NEW_BALANCE)}</td><td>{new Date(transaction.TRANSACTION_DATE).toLocaleString()}</td><td><Status value={transaction.STATUS} /></td></tr>)}</tbody></table></div>}
    {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
  </>;
}
