/* eslint-disable react/only-export-components */
export function PageHeader({title,subtitle,action}){return <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>{subtitle&&<p className="mt-1 text-sm text-slate-500">{subtitle}</p>}</div>{action}</div>}
export function Loading(){return <div className="card text-slate-500" role="status">Loading bank records…</div>}
export function Empty({text="No records match your filters."}){return <div className="card text-center text-slate-500">{text}</div>}
export function ErrorBox({message}){return message?<div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{message}</div>:null}
export function Status({value}){const tone={ACTIVE:'bg-emerald-100 text-emerald-700',SUCCESS:'bg-emerald-100 text-emerald-700',APPROVED:'bg-emerald-100 text-emerald-700',COMPLETED:'bg-emerald-100 text-emerald-700',PENDING:'bg-amber-100 text-amber-700',FROZEN:'bg-blue-100 text-blue-700',BLOCKED:'bg-red-100 text-red-700',REJECTED:'bg-red-100 text-red-700',CLOSED:'bg-slate-200 text-slate-700'};return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone[value]||'bg-slate-100 text-slate-700'}`}>{value}</span>}
export const money=value=>new Intl.NumberFormat('en-BD',{style:'currency',currency:'BDT',maximumFractionDigits:2}).format(Number(value||0));

export function Pagination({page,pageSize,total,onPage}){
  const pages=Math.max(1,Math.ceil(total/pageSize));
  if(pages<=1)return null;
  return <div className="mt-4 flex items-center justify-between text-sm"><span>Page {page} of {pages} · {total} records</span><div className="flex gap-2"><button className="btn-secondary" disabled={page<=1} onClick={()=>onPage(page-1)}>Previous</button><button className="btn-secondary" disabled={page>=pages} onClick={()=>onPage(page+1)}>Next</button></div></div>
}

export function Modal({title,onClose,children}){
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-label={title}><section className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2><button className="text-2xl text-slate-500" onClick={onClose} aria-label="Close">×</button></div>{children}</section></div>
}

export function Receipt({data,title="Transaction receipt"}){
  if(!data)return null;
  const rows=[['Reference',data.reference],['Type',data.type||'LOAN PAYMENT'],['Amount',money(data.amount)],['Account',data.maskedAccount],['Previous balance',data.previousBalance==null?'—':money(data.previousBalance)],['New balance',data.newBalance==null?'—':money(data.newBalance)],['Previous outstanding',data.previousOutstanding==null?'—':money(data.previousOutstanding)],['New outstanding',data.newOutstanding==null?'—':money(data.newOutstanding)],['Time',data.paymentTime?new Date(data.paymentTime).toLocaleString():'—'],['Status',data.status||data.loanStatus],['Processed by',data.processedBy]];
  return <div className="mb-5 rounded-xl border-2 border-emerald-200 bg-white p-5"><p className="mb-3 font-bold text-emerald-700">{title}</p><dl className="grid gap-2 text-sm sm:grid-cols-2">{rows.filter(([,value])=>value).map(([label,value])=><div key={label}><dt className="text-xs uppercase text-slate-500">{label}</dt><dd className="font-semibold">{value}</dd></div>)}</dl></div>
}
