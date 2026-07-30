import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Accounts from "./pages/Accounts";
import Audit from "./pages/Audit";
import Branches from "./pages/Branches";
import Customers from "./pages/Customers";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Loans from "./pages/Loans";
import AnimatedAuth from "./pages/AnimatedAuth";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Transactions from "./pages/Transactions";
import UserManagement from "./pages/UserManagement";
import DatabaseExplorer from "./pages/DatabaseExplorer";
import Statement from "./pages/Statement";
import Beneficiaries from "./pages/Beneficiaries";
import Kyc from "./pages/Kyc";
import DepositSuite from "./pages/DepositSuite";
import { AuthProvider, useAuth } from "./context/AuthContext";

function Protected() {
  const { user, authLoading } = useAuth();
  if (authLoading) {
    return <main className="session-loading" role="status" aria-live="polite"><span className="session-spinner" />Verifying your secure session…</main>;
  }
  if (!user) return <Navigate to="/login" replace />;
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/branches" element={["ADMIN", "MANAGER", "EMPLOYEE"].includes(user.role) ? <Branches /> : <Navigate to="/" />} />
        <Route path="/employees" element={["ADMIN", "MANAGER"].includes(user.role) ? <Employees /> : <Navigate to="/" />} />
        <Route path="/loans" element={<Loans />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/statement" element={<Statement />} />
        <Route path="/beneficiaries" element={user.role === "CUSTOMER" ? <Beneficiaries /> : ["ADMIN", "MANAGER"].includes(user.role) ? <Beneficiaries /> : <Navigate to="/" />} />
        <Route path="/kyc" element={["ADMIN", "MANAGER", "CUSTOMER"].includes(user.role) ? <Kyc /> : <Navigate to="/" />} />
        <Route path="/reports" element={["ADMIN", "MANAGER"].includes(user.role) ? <Reports /> : <Navigate to="/" />} />
        <Route path="/audit" element={user.role === "ADMIN" ? <Audit /> : <Navigate to="/" />} />
        <Route path="/user-management" element={["ADMIN", "MANAGER"].includes(user.role) ? <UserManagement /> : <Navigate to="/" />} />
        <Route path="/database-explorer" element={["ADMIN", "MANAGER"].includes(user.role) ? <DatabaseExplorer /> : <Navigate to="/" />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/deposits" element={<DepositSuite />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AnimatedAuth />} />
          <Route path="/register" element={<AnimatedAuth initialMode="signup" />} />
          <Route path="/*" element={<Protected />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
