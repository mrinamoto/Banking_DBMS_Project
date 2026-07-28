import { useState } from "react";
import { ArrowLeftRight, Eye, EyeOff, Landmark, LockKeyhole, ShieldCheck, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ErrorBox } from "../components/UI";
import { useAuth } from "../context/AuthContext";
import { messageFrom } from "../services/api";

const emptyLogin = { username: "", password: "" };
const emptySignup = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  phone: "",
  email: "",
  nationalId: "",
  address: "",
  occupation: "",
  annualIncome: "",
  username: "",
  password: "",
};

export default function Login({ initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
  const [loginForm, setLoginForm] = useState(emptyLogin);
  const [signupForm, setSignupForm] = useState(emptySignup);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();
  const isSignup = mode === "signup";

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setShowPassword(false);
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (isSignup) {
        await auth.register(signupForm);
      } else {
        await auth.login(loginForm.username, loginForm.password);
      }
      navigate("/");
    } catch (err) {
      setError(messageFrom(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className={`auth-shell ${isSignup ? "is-signup" : ""}`} aria-label="Banking authentication">
        <div className="auth-panel auth-brand-panel">
          <div className="auth-brand">
            <span className="auth-logo"><Landmark /></span>
            <div>
              <p className="auth-eyebrow">Oracle Banking DBMS</p>
              <h1>Smart Banking</h1>
            </div>
          </div>
          <p className="auth-copy">Secure academic banking workflows for customers, employees, managers, and administrators.</p>
          <div className="auth-highlights">
            <span><ShieldCheck size={17} /> JWT protected</span>
            <span><LockKeyhole size={17} /> Hashed passwords</span>
            <span><ArrowLeftRight size={17} /> Oracle transactions</span>
          </div>
          <button className="auth-toggle" type="button" onClick={() => switchMode(isSignup ? "login" : "signup")} aria-label={isSignup ? "Switch to login" : "Switch to signup"}>
            {isSignup ? <LockKeyhole size={21} /> : <UserPlus size={21} />}
          </button>
          <div className="auth-menu">
            <button type="button" className={!isSignup ? "active" : ""} onClick={() => switchMode("login")}>Sign in</button>
            <button type="button" className={isSignup ? "active" : ""} onClick={() => switchMode("signup")}>Create account</button>
          </div>
        </div>
        <div className="auth-panel auth-form-panel">
          <div className="mb-5">
            <p className="auth-eyebrow">{isSignup ? "Customer Registration" : "Welcome Back"}</p>
            <h2 className="text-2xl font-bold text-slate-950">{isSignup ? "Open your online profile" : "Sign in to your dashboard"}</h2>
          </div>
          <ErrorBox message={error} />
          <form onSubmit={submit} className="auth-form">
            {isSignup ? <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="field">First name<input required value={signupForm.firstName} onChange={(e) => setSignupForm({ ...signupForm, firstName: e.target.value })} /></label>
                <label className="field">Last name<input required value={signupForm.lastName} onChange={(e) => setSignupForm({ ...signupForm, lastName: e.target.value })} /></label>
                <label className="field">Date of birth<input type="date" required value={signupForm.dateOfBirth} onChange={(e) => setSignupForm({ ...signupForm, dateOfBirth: e.target.value })} /></label>
                <label className="field">Gender<select value={signupForm.gender} onChange={(e) => setSignupForm({ ...signupForm, gender: e.target.value })}><option value="">Prefer not to say</option><option value="M">Male</option><option value="F">Female</option><option value="O">Other</option></select></label>
                <label className="field">Phone<input required value={signupForm.phone} onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })} /></label>
                <label className="field">Email<input type="email" value={signupForm.email} onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })} /></label>
                <label className="field">National ID<input required value={signupForm.nationalId} onChange={(e) => setSignupForm({ ...signupForm, nationalId: e.target.value })} /></label>
                <label className="field">Occupation<input value={signupForm.occupation} onChange={(e) => setSignupForm({ ...signupForm, occupation: e.target.value })} /></label>
              </div>
              <label className="field">Address<textarea required rows="2" value={signupForm.address} onChange={(e) => setSignupForm({ ...signupForm, address: e.target.value })} /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="field">Annual income<input type="number" min="0" value={signupForm.annualIncome} onChange={(e) => setSignupForm({ ...signupForm, annualIncome: e.target.value })} /></label>
                <label className="field">Username<input autoComplete="username" required minLength="4" value={signupForm.username} onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })} /></label>
              </div>
            </> : <label className="field">Username<input autoComplete="username" required value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} /></label>}
            <label className="field">Password<span className="relative"><input className="w-full pr-11" type={showPassword ? "text" : "password"} autoComplete={isSignup ? "new-password" : "current-password"} required minLength={isSignup ? 10 : undefined} value={isSignup ? signupForm.password : loginForm.password} onChange={(e) => isSignup ? setSignupForm({ ...signupForm, password: e.target.value }) : setLoginForm({ ...loginForm, password: e.target.value })} /><button type="button" aria-label="Toggle password visibility" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>
            <button className="btn-primary w-full" disabled={busy}>{busy ? "Please wait..." : isSignup ? "Create customer account" : "Sign in"}</button>
          </form>
        </div>
      </section>
    </main>
  );
}
