import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const DEMO = [
  { role: "Admin", email: "admin@restaurant.com", password: "admin123" },
  { role: "Manager", email: "manager@restaurant.com", password: "manager123" },
  { role: "Cashier", email: "cashier@restaurant.com", password: "cashier123" },
  { role: "Kitchen", email: "kitchen@restaurant.com", password: "kitchen123" },
  { role: "Waiter", email: "waiter@restaurant.com", password: "waiter123" },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate("/staff-portal");
    } catch (err) {
      console.error("Login submit error:", err);
      setError(err.response?.data?.message || "Login failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const fill = (d) => {
    setEmail(d.email);
    setPassword(d.password);
  };

  return (
    <div className="login-screen staff-login-screen">
      <Link className="login-back" to="/">
        ← Portal home
      </Link>
      <div className="login-layout">
        <section className="login-promo">
          <div className="eyebrow">Role-based access</div>
          <h1>One secure counter for the whole service team.</h1>
          <p>
            Jump into dashboards, tables, orders, kitchen tickets, stock, billing,
            staff and reports with the right tools for each role.
          </p>
          <div className="login-promo-cards">
            <span><b>Admin</b> full control</span>
            <span><b>Kitchen</b> live KDS</span>
            <span><b>Cashier</b> invoices</span>
          </div>
        </section>

        <div className="login-card staff-login-card">
          <div className="login-brand">
            <div className="brand-mark">T</div>
            <div>
              <h1 className="login-title">Staff Portal</h1>
              <p className="login-sub">Admin, manager, cashier, kitchen and waiter access</p>
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={submit}>
            <div className="field">
              <label>Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@restaurant.com"
                required
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button className="btn btn-primary login-submit" disabled={busy}>
              {busy ? "Signing in…" : "Enter staff dashboard"}
            </button>
          </form>

          <div className="demo-box demo-grid">
            <strong>Demo accounts</strong>
            {DEMO.map((d) => (
              <button key={d.email} className="demo-row" type="button" onClick={() => fill(d)}>
                <span>{d.role}</span>
                <span>{d.email}</span>
              </button>
            ))}
          </div>

          <Link className="customer-redirect" to="/customer">
            Looking for table booking? Open customer portal →
          </Link>
        </div>
      </div>
    </div>
  );
}
