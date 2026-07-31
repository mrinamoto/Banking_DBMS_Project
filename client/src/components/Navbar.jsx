import { Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useBankProfile } from "../context/useBankProfile";

export default function Navbar({ onMenu }) {
  const { user } = useAuth();
  const { bank } = useBankProfile();
  return <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white px-4 sm:px-6"><button className="lg:hidden" onClick={onMenu} aria-label="Open navigation"><Menu /></button><div className="hidden text-sm text-slate-500 sm:block">{bank?.SHORT_NAME || "Smart Banking"} · Secure Oracle Dashboard</div><div className="flex items-center gap-3"><div className="text-right"><div className="text-sm font-semibold">{user.username}</div><div className="text-xs text-slate-500">{user.role}</div></div><span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-600 font-bold text-white">{user.username[0].toUpperCase()}</span></div></header>;
}
