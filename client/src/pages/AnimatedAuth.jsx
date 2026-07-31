import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Eye,
  EyeOff,
  Landmark,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { messageFrom } from "../services/api";
import "../styles/auth.css";

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
  confirmPassword: "",
};
const usernamePattern = /^[a-z0-9._-]{4,50}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signupPayload(form) {
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    dateOfBirth: form.dateOfBirth,
    gender: form.gender,
    phone: form.phone.trim(),
    email: form.email.trim(),
    nationalId: form.nationalId.trim(),
    address: form.address.trim(),
    occupation: form.occupation.trim(),
    annualIncome: form.annualIncome,
    username: form.username.trim().toLowerCase(),
    password: form.password,
  };
}

function validateSignup(form) {
  const required = [
    ["firstName", "First name"],
    ["lastName", "Last name"],
    ["dateOfBirth", "Date of birth"],
    ["phone", "Phone"],
    ["nationalId", "National ID"],
    ["address", "Address"],
    ["username", "Username"],
    ["password", "Password"],
    ["confirmPassword", "Confirm password"],
  ];
  const missing = required.find(([key]) => !String(form[key]).trim());
  if (missing) return `${missing[1]} is required.`;
  if (form.email.trim() && !emailPattern.test(form.email.trim())) return "Enter a valid email address.";
  if (form.annualIncome !== "" && (!Number.isFinite(Number(form.annualIncome)) || Number(form.annualIncome) < 0)) {
    return "Annual income must be zero or a positive number.";
  }
  if (!usernamePattern.test(form.username.trim().toLowerCase())) {
    return "Username must be 4–50 characters using letters, numbers, dots, underscores, or hyphens.";
  }
  if (form.password.length < 10) return "Password must contain at least 10 characters.";
  if (form.password !== form.confirmPassword) return "Password and confirm password do not match.";
  return "";
}

function PasswordControl({ id, value, onChange, visible, onToggle, autoComplete, describedBy }) {
  return (
    <span className="auth-password-control">
      <input
        id={id}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        required
        minLength={autoComplete === "new-password" ? 10 : undefined}
        value={value}
        onChange={onChange}
        aria-describedby={describedBy}
      />
      <button
        type="button"
        className="auth-password-toggle"
        onClick={onToggle}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </button>
    </span>
  );
}

export default function AnimatedAuth({ initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
  const [loginForm, setLoginForm] = useState(emptyLogin);
  const [signupForm, setSignupForm] = useState(emptySignup);
  const [visible, setVisible] = useState({ login: false, signup: false, confirm: false });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const headingRef = useRef(null);
  const { user, authLoading, login, register } = useAuth();
  const navigate = useNavigate();
  const isSignup = mode === "signup";

  useEffect(() => setMode(initialMode), [initialMode]);
  useEffect(() => {
    if (!authLoading && user) navigate("/", { replace: true });
  }, [authLoading, navigate, user]);

  function updateSignup(key, value) {
    setSignupForm((current) => ({ ...current, [key]: value }));
    if (error) setError("");
  }

  function updateLogin(key, value) {
    setLoginForm((current) => ({ ...current, [key]: value }));
    if (error) setError("");
  }

  function switchMode(nextMode) {
    if (busy || nextMode === mode) return;
    setMode(nextMode);
    setError("");
    setVisible({ login: false, signup: false, confirm: false });
    navigate(nextMode === "signup" ? "/register" : "/login", { replace: true });
    window.setTimeout(() => headingRef.current?.focus(), 50);
  }

  async function submitLogin(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await login(loginForm.username.trim(), loginForm.password);
      navigate("/", { replace: true });
    } catch (requestError) {
      setError(messageFrom(requestError));
    } finally {
      setBusy(false);
    }
  }

  async function submitSignup(event) {
    event.preventDefault();
    if (busy) return;
    const validationError = validateSignup(signupForm);
    if (validationError) {
      setError(validationError);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await register(signupPayload(signupForm));
      navigate("/", { replace: true });
    } catch (requestError) {
      setError(messageFrom(requestError));
    } finally {
      setBusy(false);
    }
  }

  function togglePassword(key) {
    setVisible((current) => ({ ...current, [key]: !current[key] }));
  }

  return (
    <main className="auth-page">
      <div className="auth-background-orb auth-background-orb-one" aria-hidden="true" />
      <div className="auth-background-orb auth-background-orb-two" aria-hidden="true" />
      <section className={`auth-container ${isSignup ? "auth-is-signup" : ""}`} aria-label="Smart Banking authentication">
        <section className="auth-form-panel auth-login-panel" aria-hidden={isSignup} inert={isSignup}>
          <div className="auth-form-scroll">
            <MobileBrand />
            <p className="auth-kicker">Secure account access</p>
            <h1 ref={!isSignup ? headingRef : null} tabIndex="-1">Welcome back</h1>
            <p className="auth-intro">Sign in to your protected banking dashboard.</p>
            {error && !isSignup && <div className="auth-error" role="alert" aria-live="assertive">{error}</div>}
            <form className="auth-form auth-login-form" onSubmit={submitLogin} noValidate>
              <div className="auth-field">
                <label htmlFor="login-username">Username or Staff ID</label>
                <input id="login-username" autoComplete="username" required value={loginForm.username} onChange={(event) => updateLogin("username", event.target.value)} />
              </div>
              <div className="auth-field">
                <label htmlFor="login-password">Password</label>
                <PasswordControl id="login-password" value={loginForm.password} onChange={(event) => updateLogin("password", event.target.value)} visible={visible.login} onToggle={() => togglePassword("login")} autoComplete="current-password" />
              </div>
              <SubmitButton busy={busy} disabled={authLoading} busyText="Signing in…" text="Sign in securely" icon={<ArrowRight />} />
            </form>
            <MobileSwitch prompt="New to Smart Banking?" action="Create an account" onClick={() => switchMode("signup")} />
          </div>
        </section>

        <section className="auth-form-panel auth-signup-panel" aria-hidden={!isSignup} inert={!isSignup}>
          <div className="auth-form-scroll">
            <MobileBrand />
            <p className="auth-kicker">Customer registration</p>
            <h1 ref={isSignup ? headingRef : null} tabIndex="-1">Create your profile</h1>
            <p className="auth-intro">Register a secure customer login. Banking accounts are opened separately by authorized staff.</p>
            {error && isSignup && <div className="auth-error" role="alert" aria-live="assertive">{error}</div>}
            <form className="auth-form auth-signup-form" onSubmit={submitSignup} noValidate>
              <div className="auth-field-grid">
                <Field id="signup-first-name" label="First name"><input id="signup-first-name" autoComplete="given-name" required value={signupForm.firstName} onChange={(event) => updateSignup("firstName", event.target.value)} /></Field>
                <Field id="signup-last-name" label="Last name"><input id="signup-last-name" autoComplete="family-name" required value={signupForm.lastName} onChange={(event) => updateSignup("lastName", event.target.value)} /></Field>
                <Field id="signup-date-of-birth" label="Date of birth"><input id="signup-date-of-birth" type="date" autoComplete="bday" max={new Date().toISOString().slice(0, 10)} required value={signupForm.dateOfBirth} onChange={(event) => updateSignup("dateOfBirth", event.target.value)} /></Field>
                <Field id="signup-gender" label="Gender" optional><select id="signup-gender" value={signupForm.gender} onChange={(event) => updateSignup("gender", event.target.value)}><option value="">Prefer not to say</option><option value="M">Male</option><option value="F">Female</option><option value="O">Other</option></select></Field>
                <Field id="signup-phone" label="Phone"><input id="signup-phone" type="tel" autoComplete="tel" required value={signupForm.phone} onChange={(event) => updateSignup("phone", event.target.value)} /></Field>
                <Field id="signup-email" label="Email" optional><input id="signup-email" type="email" autoComplete="email" value={signupForm.email} onChange={(event) => updateSignup("email", event.target.value)} /></Field>
                <Field id="signup-national-id" label="National ID"><input id="signup-national-id" required value={signupForm.nationalId} onChange={(event) => updateSignup("nationalId", event.target.value)} /></Field>
                <Field id="signup-occupation" label="Occupation" optional><input id="signup-occupation" autoComplete="organization-title" value={signupForm.occupation} onChange={(event) => updateSignup("occupation", event.target.value)} /></Field>
              </div>
              <Field id="signup-address" label="Address"><textarea id="signup-address" autoComplete="street-address" rows="2" required value={signupForm.address} onChange={(event) => updateSignup("address", event.target.value)} /></Field>
              <div className="auth-field-grid">
                <Field id="signup-income" label="Annual income" optional><input id="signup-income" type="number" min="0" step="0.01" inputMode="decimal" value={signupForm.annualIncome} onChange={(event) => updateSignup("annualIncome", event.target.value)} /></Field>
                <Field id="signup-username" label="Username" help="4–50 letters, numbers, dots, underscores, or hyphens."><input id="signup-username" autoComplete="username" minLength="4" maxLength="50" pattern="[A-Za-z0-9._-]{4,50}" aria-describedby="signup-username-help" required value={signupForm.username} onChange={(event) => updateSignup("username", event.target.value)} /></Field>
                <Field id="signup-password" label="Password" help="Use at least 10 characters."><PasswordControl id="signup-password" value={signupForm.password} onChange={(event) => updateSignup("password", event.target.value)} visible={visible.signup} onToggle={() => togglePassword("signup")} autoComplete="new-password" describedBy="signup-password-help" /></Field>
                <Field id="signup-confirm-password" label="Confirm password"><PasswordControl id="signup-confirm-password" value={signupForm.confirmPassword} onChange={(event) => updateSignup("confirmPassword", event.target.value)} visible={visible.confirm} onToggle={() => togglePassword("confirm")} autoComplete="new-password" /></Field>
              </div>
              <SubmitButton busy={busy} disabled={authLoading} busyText="Creating account…" text="Create customer account" icon={<UserPlus />} />
            </form>
            <MobileSwitch prompt="Already registered?" action="Sign in" onClick={() => switchMode("login")} />
          </div>
        </section>

        <aside className="auth-overlay" aria-hidden="true">
          <div className="auth-overlay-content auth-overlay-login">
            <BrandMark />
            <p className="auth-brand-overline">Smart Banking</p>
            <h2>Your finances, protected.</h2>
            <p>JWT-secured access with role-based controls and Oracle-backed transactions.</p>
            <div className="auth-trust-list"><span><ShieldCheck />Protected sessions</span><span><LockKeyhole />Hashed credentials</span><span><BadgeCheck />Verified banking flows</span></div>
            <button type="button" className="auth-outline-button" onClick={() => switchMode("signup")}>Create customer account</button>
          </div>
          <div className="auth-overlay-content auth-overlay-signup">
            <BrandMark />
            <p className="auth-brand-overline">Welcome aboard</p>
            <h2>Already have access?</h2>
            <p>Return to your dashboard and continue managing your banking activity securely.</p>
            <button type="button" className="auth-outline-button" onClick={() => switchMode("login")}>Back to sign in</button>
          </div>
        </aside>
      </section>
      <p className="auth-footnote">Academic banking simulation · Never use real financial credentials</p>
    </main>
  );
}

function Field({ id, label, optional, help, children }) {
  return <div className="auth-field"><label htmlFor={id}>{label} {optional && <span>(optional)</span>}</label>{children}{help && <small id={`${id}-help`}>{help}</small>}</div>;
}

function SubmitButton({ busy, disabled, busyText, text, icon }) {
  return <button className="auth-submit" type="submit" disabled={busy || disabled}>{busy ? <><LoaderCircle className="auth-spinner" />{busyText}</> : <>{text}{icon}</>}</button>;
}

function MobileBrand() {
  return <div className="auth-mobile-brand"><Landmark /><span>Smart Banking</span></div>;
}

function MobileSwitch({ prompt, action, onClick }) {
  return <p className="auth-mobile-switch">{prompt} <button type="button" onClick={onClick}>{action}</button></p>;
}

function BrandMark() {
  return <div className="auth-brand-mark"><Landmark /></div>;
}
