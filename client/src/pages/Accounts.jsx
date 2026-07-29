import { useEffect, useState } from "react";
import api, { messageFrom } from "../services/api";
import { Empty, ErrorBox, Loading, money, PageHeader, Pagination, Status } from "../components/UI";
import { useAuth } from "../context/AuthContext";

const initialForm = { customerId: "", branchId: "", accountTypeId: "", initialDeposit: "" };

export default function Accounts() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [lookups, setLookups] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const requests = [
        api.get("/accounts", { params: { page, search } }),
        api.get("/lookups"),
      ];
      if (user.role !== "CUSTOMER") requests.push(api.get("/customers", { params: { pageSize: 100 } }));
      const [accountsResult, lookupResult, customerResult] = await Promise.all(requests);
      setData(accountsResult.data);
      setLookups(lookupResult.data);
      setCustomers(customerResult?.data.items || []);
      setError("");
    } catch (requestError) {
      setError(messageFrom(requestError));
    }
  }

  useEffect(() => { load(); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const result = await api.post("/accounts", form);
      setNotice(`Account ${result.data.accountNumber} opened successfully.`);
      setForm(initialForm);
      setOpen(false);
      await load();
    } catch (requestError) { setError(messageFrom(requestError)); }
    finally { setBusy(false); }
  }

  async function changeStatus(account, status) {
    if (busy) return;
    if (!window.confirm(`${status} account ending ${account.ACCOUNT_NUMBER.slice(-4)}?`)) return;
    setBusy(true);
    try {
      await api.patch(`/accounts/${account.ACCOUNT_ID}/status`, { status });
      setNotice(`Account status changed to ${status}.`);
      await load();
    } catch (requestError) { setError(messageFrom(requestError)); }
    finally { setBusy(false); }
  }

  if (!data && !error) return <Loading />;
  return <>
    <PageHeader title="Accounts" subtitle="Oracle-controlled balances, available funds, and account status" action={user.role !== "CUSTOMER" && <button className="btn-primary" disabled={busy} onClick={() => setOpen(!open)}>Open account</button>} />
    {notice && <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-emerald-700">{notice}</div>}
    <ErrorBox message={error} />
    {open && <form className="card mb-5 grid gap-4 sm:grid-cols-2" onSubmit={save}>
      <label className="field">Customer
        <select required value={form.customerId} onChange={(event) => setForm({ ...form, customerId: event.target.value })}>
          <option value="">Search/select a customer</option>
          {customers.map((customer) => <option value={customer.CUSTOMER_ID} key={customer.CUSTOMER_ID}>{customer.FIRST_NAME} {customer.LAST_NAME} · {customer.PHONE} · NID …{customer.NATIONAL_ID.slice(-4)}</option>)}
        </select>
      </label>
      <label className="field">Branch
        <select required value={form.branchId} onChange={(event) => setForm({ ...form, branchId: event.target.value })}><option value="">Select</option>{lookups?.branches.map((item) => <option value={item.ID} key={item.ID}>{item.LABEL}</option>)}</select>
      </label>
      <label className="field">Account type
        <select required value={form.accountTypeId} onChange={(event) => setForm({ ...form, accountTypeId: event.target.value })}><option value="">Select</option>{lookups?.accountTypes.map((item) => <option value={item.ID} key={item.ID}>{item.LABEL} (minimum {money(item.MIN_BALANCE)})</option>)}</select>
      </label>
      <label className="field">Initial deposit<input type="number" min="0" step="0.01" required value={form.initialDeposit} onChange={(event) => setForm({ ...form, initialDeposit: event.target.value })} /></label>
      <button className="btn-primary" disabled={busy}>{busy ? "Opening…" : "Open account"}</button>
    </form>}
    <div className="mb-4 flex gap-2"><input className="input flex-1" placeholder="Search account or customer" value={search} onChange={(event) => setSearch(event.target.value)} /><button className="btn-secondary" onClick={() => { setPage(1); load(); }}>Search</button></div>
    {!data?.items.length ? <Empty /> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Account</th><th>Customer</th><th>Type</th><th>Branch</th><th>Balance</th><th>Available</th><th>Status</th><th>Actions</th></tr></thead><tbody>{data.items.map((account) => <tr key={account.ACCOUNT_ID}><td className="font-mono">{account.ACCOUNT_NUMBER}</td><td>{account.CUSTOMER_NAME}</td><td>{account.TYPE_NAME}</td><td>{account.BRANCH_NAME}</td><td className="font-semibold">{money(account.BALANCE)}</td><td>{money(account.AVAILABLE_BALANCE)}</td><td><Status value={account.STATUS} /></td><td>{user.role === "CUSTOMER" ? "—" : <div className="flex gap-2">{account.STATUS !== "FROZEN" && account.STATUS !== "CLOSED" && <button className="text-blue-700" onClick={() => changeStatus(account, "FROZEN")}>Freeze</button>}{account.STATUS === "FROZEN" && <button className="text-emerald-700" onClick={() => changeStatus(account, "ACTIVE")}>Activate</button>}{account.STATUS !== "CLOSED" && <button className="text-red-700" onClick={() => changeStatus(account, "CLOSED")}>Close</button>}</div>}</td></tr>)}</tbody></table></div>}
    {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
  </>;
}
