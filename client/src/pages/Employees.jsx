import { useEffect, useState } from "react";
import api, { messageFrom } from "../services/api";
import { Empty, ErrorBox, Loading, Modal, money, PageHeader, Status } from "../components/UI";

const emptyForm = { branchId: "", employeeCode: "", firstName: "", lastName: "", nationalId: "", jobTitle: "", email: "", phone: "", salary: "" };

export default function Employees() {
  const [rows, setRows] = useState(null);
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [employees, lookups] = await Promise.all([api.get("/employees"), api.get("/lookups")]);
      setRows(employees.data);setBranches(lookups.data.branches);setError("");
    } catch (requestError) { setError(messageFrom(requestError)); }
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function beginEdit(employee) {
    setEditing(employee);
    setForm({ branchId: branches.find((item) => item.LABEL === employee.BRANCH_NAME)?.ID || "", employeeCode: employee.EMPLOYEE_CODE, firstName: "", lastName: "", nationalId: "", jobTitle: employee.JOB_TITLE, email: employee.EMAIL, phone: employee.PHONE || "", salary: employee.SALARY });
  }
  async function save(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (editing === "new") await api.post("/employees", form);
      else await api.patch(`/employees/${editing.EMPLOYEE_ID}`, form);
      setNotice(editing === "new" ? "Employee created." : "Employee updated.");setEditing(null);setForm(emptyForm);await load();
    } catch (requestError) { setError(messageFrom(requestError)); }
    finally { setBusy(false); }
  }
  async function toggle(employee) {
    if (busy) return;
    const status = employee.STATUS === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    if (!window.confirm(`Change employee status to ${status}?`)) return;
    setBusy(true);
    try { await api.patch(`/employees/${employee.EMPLOYEE_ID}/status`, { status });await load(); }
    catch (requestError) { setError(messageFrom(requestError)); }
    finally { setBusy(false); }
  }
  if (!rows && !error) return <Loading />;
  const creating = editing === "new";
  return <>
    <PageHeader title="Employees" subtitle="Branch-scoped staff management" action={<button className="btn-primary" disabled={busy} onClick={() => { setEditing("new");setForm(emptyForm); }}>Create employee</button>} />
    {notice && <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-emerald-700">{notice}</div>}
    <ErrorBox message={error} />
    {!rows?.length ? <Empty /> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Code</th><th>Name</th><th>Branch</th><th>Designation</th><th>Email</th><th>Salary</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map((employee) => <tr key={employee.EMPLOYEE_ID}><td>{employee.EMPLOYEE_CODE}</td><td className="font-semibold">{employee.EMPLOYEE_NAME}</td><td>{employee.BRANCH_NAME}</td><td>{employee.JOB_TITLE}</td><td>{employee.EMAIL}</td><td>{money(employee.SALARY)}</td><td><Status value={employee.STATUS} /></td><td><div className="flex gap-2"><button disabled={busy} className="text-blue-700 disabled:opacity-50" onClick={() => beginEdit(employee)}>Edit</button><button disabled={busy} className="text-red-700 disabled:opacity-50" onClick={() => toggle(employee)}>{employee.STATUS === "ACTIVE" ? "Deactivate" : "Activate"}</button></div></td></tr>)}</tbody></table></div>}
    {editing && <Modal title={creating ? "Create employee" : "Update employee"} onClose={() => { if (!busy) setEditing(null); }}><form onSubmit={save} className="grid gap-4 sm:grid-cols-2"><label className="field">Branch<select required value={form.branchId} onChange={(event) => setForm({ ...form, branchId: event.target.value })}><option value="">Select</option>{branches.map((item) => <option key={item.ID} value={item.ID}>{item.LABEL}</option>)}</select></label>{creating && <><label className="field">Employee code<input required value={form.employeeCode} onChange={(event) => setForm({ ...form, employeeCode: event.target.value })} /></label><label className="field">First name<input required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></label><label className="field">Last name<input required value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></label><label className="field">National ID<input required value={form.nationalId} onChange={(event) => setForm({ ...form, nationalId: event.target.value })} /></label></>}<label className="field">Designation<input required value={form.jobTitle} onChange={(event) => setForm({ ...form, jobTitle: event.target.value })} /></label><label className="field">Email<input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label className="field">Phone<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label><label className="field">Salary<input type="number" min="0.01" step="0.01" required value={form.salary} onChange={(event) => setForm({ ...form, salary: event.target.value })} /></label><button className="btn-primary sm:col-span-2" disabled={busy}>{busy ? "Saving…" : creating ? "Create employee" : "Save changes"}</button></form></Modal>}
  </>;
}
