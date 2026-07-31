import { useEffect, useState } from "react";
import api, { messageFrom } from "../services/api";
import { Empty, ErrorBox, Loading, PageHeader, Pagination, Status } from "../components/UI";

export default function Notifications() {
  const [data, setData] = useState(null); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function load() { try { setData((await api.get("/notifications", { params: { pageSize: 20 } })).data); setError(""); } catch (e) { setError(messageFrom(e)); } }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  async function read(id) { if (busy) return; setBusy(true); try { await api.patch(`/notifications/${id}/read`); await load(); } catch (e) { setError(messageFrom(e)); } finally { setBusy(false); } }
  async function readAll() { if (busy) return; setBusy(true); try { await api.post("/notifications/read-all"); await load(); } catch (e) { setError(messageFrom(e)); } finally { setBusy(false); } }
  if (!data && !error) return <Loading />;
  return <><PageHeader title="Notification Center" subtitle={`${data?.unread || 0} unread Oracle-backed notifications`} action={<button className="btn-secondary" disabled={busy || !data?.unread} onClick={readAll}>Mark all read</button>} /><ErrorBox message={error} />{!data?.items?.length ? <Empty text="No notifications yet." /> : <div className="space-y-3">{data.items.map((item) => <article className={`card flex items-start justify-between gap-4 ${item.IS_READ === "N" ? "border-emerald-300" : ""}`} key={item.NOTIFICATION_ID}><div><div className="flex items-center gap-2"><h2 className="font-semibold">{item.TITLE}</h2><Status value={item.IS_READ === "Y" ? "READ" : "UNREAD"} /></div><p className="mt-1 text-sm text-slate-600">{item.MESSAGE}</p><p className="mt-2 text-xs text-slate-500">{item.EVENT_TYPE} · {new Date(item.CREATED_AT).toLocaleString()}</p></div>{item.IS_READ === "N" && <button className="text-sm text-emerald-700" disabled={busy} onClick={() => read(item.NOTIFICATION_ID)}>Mark read</button>}</article>)}</div>}{data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={() => {}} />}</>;
}
