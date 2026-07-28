import { KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { PageHeader } from "../components/UI";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user } = useAuth();
  const permissions = {
    ADMIN: "Full system access including audit logs, branches, reports, customers, employees, accounts, loans, and transactions.",
    MANAGER: "Branch-level access for staff, customer, account, loan, transaction, and report workflows.",
    EMPLOYEE: "Branch-level customer service access for customers, accounts, loans, and teller transactions.",
    CUSTOMER: "Personal access for owned customer profile, accounts, transfers, loan applications, and history.",
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Review the active session and role-based banking permissions." />
      <div className="grid gap-5 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-lg bg-emerald-100 p-3 text-emerald-700"><UserRound /></span>
            <div>
              <h2 className="text-lg font-bold">Signed-in user</h2>
              <p className="text-sm text-slate-500">Session data comes from the verified JWT payload.</p>
            </div>
          </div>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-xs uppercase text-slate-500">Username</dt><dd className="font-semibold">{user.username}</dd></div>
            <div><dt className="text-xs uppercase text-slate-500">Role</dt><dd className="font-semibold">{user.role}</dd></div>
            <div><dt className="text-xs uppercase text-slate-500">Customer ID</dt><dd className="font-semibold">{user.customerId || "Not linked"}</dd></div>
            <div><dt className="text-xs uppercase text-slate-500">Employee ID</dt><dd className="font-semibold">{user.employeeId || "Not linked"}</dd></div>
            <div><dt className="text-xs uppercase text-slate-500">Branch ID</dt><dd className="font-semibold">{user.branchId || "All allowed branches"}</dd></div>
          </dl>
        </section>
        <section className="card">
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-lg bg-blue-100 p-3 text-blue-700"><ShieldCheck /></span>
            <h2 className="text-lg font-bold">Permission scope</h2>
          </div>
          <p className="text-sm leading-6 text-slate-600">{permissions[user.role]}</p>
        </section>
        <section className="card lg:col-span-3">
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-lg bg-slate-100 p-3 text-slate-700"><KeyRound /></span>
            <h2 className="text-lg font-bold">Security model</h2>
          </div>
          <div className="grid gap-4 text-sm text-slate-600 md:grid-cols-3">
            <p>Passwords are hashed on the backend before they are stored in Oracle.</p>
            <p>Protected API routes verify the JWT before accessing business data.</p>
            <p>Role and branch checks run in Express controllers, not only in the React UI.</p>
          </div>
        </section>
      </div>
    </>
  );
}
