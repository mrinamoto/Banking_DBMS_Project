import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Accounts from "./pages/Accounts";
import Audit from "./pages/Audit";
import Branches from "./pages/Branches";
import Customers from "./pages/Customers";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Loans from "./pages/Loans";
import Login from "./pages/Login";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Transactions from "./pages/Transactions";
import { AuthProvider, useAuth } from "./context/AuthContext";

function Protected() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
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
        <Route path="/reports" element={["ADMIN", "MANAGER"].includes(user.role) ? <Reports /> : <Navigate to="/" />} />
        <Route path="/audit" element={user.role === "ADMIN" ? <Audit /> : <Navigate to="/" />} />
        <Route path="/settings" element={<Settings />} />
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
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Login initialMode="signup" />} />
          <Route path="/*" element={<Protected />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
