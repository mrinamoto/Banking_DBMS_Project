import { useEffect, useState } from "react";
import api, { messageFrom } from "../services/api";
import { Empty, ErrorBox, Loading, PageHeader, Pagination } from "../components/UI";

export default function Audit() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    api.get("/audit", { params: { page, search: appliedSearch } })
      .then((result) => { setData(result.data);setError(""); })
      .catch((requestError) => setError(messageFrom(requestError)));
  }, [page, appliedSearch]);
  if (!data && !error) return <Loading />;
  return <>
    <PageHeader title="Audit log" subtitle="Admin-only application actor and before/after summaries" />
    <ErrorBox message={error} />
    <div className="mb-4 flex gap-2"><input className="input flex-1" placeholder="Search actor, table, or action" value={search} onChange={(event) => setSearch(event.target.value)} /><button className="btn-primary" onClick={() => { setPage(1);setAppliedSearch(search); }}>Search</button></div>
    {!data?.items.length ? <Empty /> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Time</th><th>Actor</th><th>Table</th><th>Record</th><th>Action</th><th>Old summary</th><th>New summary</th></tr></thead><tbody>{data.items.map((item) => <tr key={item.AUDIT_ID}><td>{new Date(item.ACTION_DATE).toLocaleString()}</td><td>{item.ACTION_BY}</td><td>{item.TABLE_NAME}</td><td>{item.RECORD_ID}</td><td>{item.ACTION_NAME}</td><td className="max-w-xs whitespace-normal">{item.OLD_SUMMARY || "—"}</td><td className="max-w-xs whitespace-normal">{item.NEW_SUMMARY || "—"}</td></tr>)}</tbody></table></div>}
    {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
  </>;
}
