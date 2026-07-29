import { useEffect, useState } from "react";
import api, { messageFrom } from "../services/api";
import { Empty, ErrorBox, Loading, PageHeader, Status } from "../components/UI";
import { useAuth } from "../context/AuthContext";

const initialForm = { branchCode: "", branchName: "", city: "", address: "", phone: "", swiftCode: "" };

export default function Branches() {
  const { user } = useAuth();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(initialForm);

  async function load() {
    try {
      setRows((await api.get("/branches")).data);
      setError("");
    } catch (requestError) {
      setError(messageFrom(requestError));
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function save(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await api.post("/branches", form);
      setOpen(false);
      setForm(initialForm);
      setNotice("Branch created successfully.");
      await load();
    } catch (requestError) {
      setError(messageFrom(requestError));
    } finally {
      setBusy(false);
    }
  }

  if (!rows && !error) return <Loading />;
  return <>
    <PageHeader title="Branches" subtitle="Active and inactive service locations" action={user.role === "ADMIN" && <button className="btn-primary" disabled={busy} onClick={() => setOpen(!open)}>{open ? "Close form" : "Add branch"}</button>} />
    {notice && <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-emerald-700" role="status">{notice}</div>}
    <ErrorBox message={error} />
    {open && <form onSubmit={save} className="card mb-5 grid gap-4 sm:grid-cols-2">
      {Object.keys(form).map((key) => <label className="field" key={key}>{key.replace(/([A-Z])/g, " $1")}<input required={["branchCode", "branchName", "city", "address"].includes(key)} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></label>)}
      <div className="flex gap-3"><button className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Save branch"}</button><button type="button" className="btn-secondary" disabled={busy} onClick={() => setOpen(false)}>Cancel</button></div>
    </form>}
    {!rows?.length ? <Empty /> : <div className="grid gap-4 md:grid-cols-2">{rows.map((branch) => <article className="card" key={branch.BRANCH_ID}><div className="flex justify-between"><h2 className="font-bold">{branch.BRANCH_NAME}</h2><Status value={branch.STATUS} /></div><p className="mt-2 text-sm text-slate-500">{branch.BRANCH_CODE} · {branch.CITY}</p><p className="mt-3 text-sm">{branch.ADDRESS}</p></article>)}</div>}
  </>;
}
