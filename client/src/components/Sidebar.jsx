import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ArrowLeftRight, BadgeCheck, Bell, Building2, Calculator, ChartColumn, ClipboardList, Database, FileText, Landmark, LayoutDashboard, LogOut, ScrollText, Settings, ShieldCheck, UserCheck, Users, Wallet, Briefcase, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useBankProfile } from "../context/useBankProfile";

const items = [
  ["/", LayoutDashboard, "Dashboard", null], ["/notifications", Bell, "Notifications", null], ["/service-requests", ClipboardList, "Service Requests", null], ["/customers", Users, "Customers", null], ["/accounts", Wallet, "Accounts", null], ["/statement", FileText, "Bank Statement", null], ["/deposits", Calculator, "Deposit schemes", null], ["/branches", Building2, "Branches", ["ADMIN", "MANAGER", "EMPLOYEE"]], ["/employees", Briefcase, "Employees", ["ADMIN", "MANAGER"]], ["/user-management", ShieldCheck, "User Management", ["ADMIN", "MANAGER"]], ["/database-explorer", Database, "Database Explorer", ["ADMIN", "MANAGER"]], ["/beneficiaries", UserCheck, "Beneficiaries", ["ADMIN", "MANAGER", "CUSTOMER"]], ["/kyc", BadgeCheck, "Customer KYC", ["ADMIN", "MANAGER", "CUSTOMER"]], ["/loans", Landmark, "Loans", null], ["/transactions", ArrowLeftRight, "Transactions", null], ["/reports", ChartColumn, "Reports", ["ADMIN", "MANAGER"]], ["/audit", ScrollText, "Audit log", ["ADMIN"]], ["/settings", Settings, "Settings", null]
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const { bank } = useBankProfile();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try { await logout(); } finally { navigate("/login", { replace: true }); }
  }
  return <>
    <div className={`fixed inset-0 z-30 bg-slate-950/50 lg:hidden ${open ? "block" : "hidden"}`} onClick={onClose} />
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 transform flex-col bg-slate-950 text-white transition lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
        <span className="font-bold"><Landmark className="mr-2 inline text-emerald-400" />{bank?.SHORT_NAME || "Smart Banking"}</span>
        <button className="lg:hidden" onClick={onClose} aria-label="Close navigation"><X /></button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.filter(([, , , roles]) => !roles || roles.includes(user.role)).map(([to, Icon, label]) => <NavLink end={to === "/"} onClick={onClose} key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${isActive ? "bg-emerald-600 font-semibold" : "text-slate-300 hover:bg-slate-800"}`}><Icon size={19} />{label}</NavLink>)}
      </nav>
      <button onClick={signOut} disabled={signingOut} className="flex items-center gap-3 border-t border-slate-800 p-5 text-sm text-slate-300 hover:bg-slate-900 disabled:cursor-wait disabled:opacity-60"><LogOut size={19} />{signingOut ? "Signing out…" : "Sign out"}</button>
    </aside>
  </>;
}
