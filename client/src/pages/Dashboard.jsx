import { useEffect, useState } from "react";
import { Briefcase, Landmark, Users, Wallet } from "lucide-react";
import api, { messageFrom } from "../services/api";
import { ErrorBox, Loading, money, PageHeader } from "../components/UI";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api.get("/dashboard").then((result) => setData(result.data)).catch((requestError) => setError(messageFrom(requestError)));
  }, []);
  if (!data && !error) return <Loading />;
  const cards = data ? [
    [Users, "Customers", data.totalCustomers, "text-blue-600"],
    [Wallet, "Accounts", data.totalAccounts, "text-emerald-600"],
    [Briefcase, "Employees", data.totalEmployees, "text-violet-600"],
    [Landmark, "Loans", data.totalLoans, "text-amber-600"],
  ] : [];
  return <>
    <PageHeader title="Dashboard" subtitle="Live operational totals from Oracle" />
    <ErrorBox message={error} />
    {data && <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([Icon, label, value, color]) => <div className="card" key={label}><Icon className={color} /><p className="mt-4 text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>)}</div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card"><p className="text-sm text-slate-500">Account balance</p><p className="mt-2 text-2xl font-bold text-emerald-700">{money(data.totalBalance)}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Operational Transaction Volume</p><p className="mt-2 text-2xl font-bold">{money(data.transactionVolume)}</p><p className="mt-1 text-xs text-slate-500">Transfer credit rows are excluded to avoid double counting.</p></div>
        <div className="card lg:row-span-2"><h2 className="mb-4 font-bold">Recent activity</h2>{data.recentTransactions.map((transaction) => <div className="flex items-center justify-between border-b py-3 last:border-0" key={transaction.REFERENCE_NO}><span><span className="block text-sm font-medium">{transaction.TRANSACTION_TYPE.replaceAll("_", " ")}</span><span className="text-xs text-slate-500">{transaction.REFERENCE_NO}</span></span><b>{money(transaction.AMOUNT)}</b></div>)}</div>
      </div>
    </>}
  </>;
}
