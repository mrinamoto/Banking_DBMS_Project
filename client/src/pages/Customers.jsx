import { useEffect, useState } from "react";
import { Edit3, Plus, Search } from "lucide-react";
import api, { messageFrom } from "../services/api";
import { Empty, ErrorBox, Loading, Modal, PageHeader, Pagination, Status } from "../components/UI";
import { useAuth } from "../context/AuthContext";

const initial = { firstName: "", lastName: "", dateOfBirth: "", gender: "", phone: "", email: "", nationalId: "", address: "", occupation: "", annualIncome: "" };

export default function Customers() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [form, setForm] = useState(initial);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ phone: "", email: "", address: "" });

  async function load() {
    try { const result = await api.get("/customers", { params: { search: appliedSearch, page } });setData(result.data);setError(""); }
    catch (requestError) { setError(messageFrom(requestError)); }
  }
  useEffect(() => { load(); }, [page, appliedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try { await api.post("/customers", form);setForm(initial);setOpen(false);setNotice("Customer registered successfully.");await load(); }
    catch (requestError) { setError(messageFrom(requestError)); }
    finally { setBusy(false); }
  }

  function beginEdit(customer) {
    setEditing(customer);
    setEditForm({ phone: customer.PHONE || "", email: customer.EMAIL || "", address: customer.ADDRESS || "" });
    setError("");
  }

  async function update(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await api.patch(`/customers/${editing.CUSTOMER_ID}`, editForm);
      setEditing(null);
      setNotice("Customer details updated successfully.");
      await load();
    } catch (requestError) {
      setError(messageFrom(requestError));
    } finally {
      setBusy(false);
    }
  }
  if (!data && !error) return <Loading />;
  return <>
    <PageHeader title="Customers" subtitle="Search, register, and review customer profiles" action={user.role !== "CUSTOMER" && <button className="btn-primary flex gap-2" onClick={() => setOpen(!open)}><Plus size={18} />Register customer</button>} />
    {notice && <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-emerald-700">{notice}</div>}
    <ErrorBox message={error} />
    {open && <form onSubmit={submit} className="card mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className="field">First name<input required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></label>
      <label className="field">Last name<input required value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></label>
      <label className="field">Date of birth<input type="date" required value={form.dateOfBirth} onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })} /></label>
      <label className="field">Gender<select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })}><option value="">Prefer not to say</option><option value="M">Male</option><option value="F">Female</option><option value="O">Other</option></select></label>
      <label className="field">Phone<input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
      <label className="field">Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
      <label className="field">National ID<input required value={form.nationalId} onChange={(event) => setForm({ ...form, nationalId: event.target.value })} /></label>
      <label className="field sm:col-span-2">Address<input required value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
      <label className="field">Occupation<input value={form.occupation} onChange={(event) => setForm({ ...form, occupation: event.target.value })} /></label>
      <label className="field">Annual income<input type="number" min="0" value={form.annualIncome} onChange={(event) => setForm({ ...form, annualIncome: event.target.value })} /></label>
      <div className="flex gap-3 sm:col-span-2 lg:col-span-3"><button className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Save customer"}</button><button type="button" className="btn-secondary" disabled={busy} onClick={() => setOpen(false)}>Cancel</button></div>
    </form>}
    <div className="relative mb-4"><Search className="absolute left-3 top-3 text-slate-400" size={18} /><input className="input w-full pl-10" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { setPage(1);setAppliedSearch(search); } }} placeholder="Search name, phone, or national ID" /></div>
    {!data?.items.length ? <Empty /> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Name</th><th>Phone</th><th>National ID</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead><tbody>{data.items.map((customer) => <tr key={customer.CUSTOMER_ID}><td className="font-semibold">{customer.FIRST_NAME} {customer.LAST_NAME}</td><td>{customer.PHONE}</td><td>{customer.NATIONAL_ID}</td><td>{customer.EMAIL || "—"}</td><td><Status value={customer.STATUS} /></td><td><button className="flex items-center gap-1 text-blue-700 disabled:opacity-50" disabled={busy} onClick={() => beginEdit(customer)}><Edit3 size={15} />Edit</button></td></tr>)}</tbody></table></div>}
    {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
    {editing && <Modal title={`Update ${editing.FIRST_NAME} ${editing.LAST_NAME}`} onClose={() => { if (!busy) setEditing(null); }}><form onSubmit={update} className="grid gap-4"><label className="field">Phone<input required value={editForm.phone} onChange={(event) => setEditForm({ ...editForm, phone: event.target.value })} /></label><label className="field">Email<input type="email" value={editForm.email} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} /></label><label className="field">Address<textarea required rows="3" value={editForm.address} onChange={(event) => setEditForm({ ...editForm, address: event.target.value })} /></label><button className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button></form></Modal>}
  </>;
}
