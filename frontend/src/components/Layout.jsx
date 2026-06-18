import { useEffect, useMemo, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const NAV = [
  { to: "/staff-portal", label: "Dashboard", icon: "▦", roles: ["admin", "manager", "cashier", "kitchen", "waiter"], hint: "Pulse, sales, alerts" },
  { to: "/staff-portal/reservations", label: "Reservations", icon: "▤", roles: ["admin", "manager", "waiter"], hint: "Bookings and tables" },
  { to: "/staff-portal/orders", label: "Orders", icon: "▣", roles: ["admin", "manager", "waiter"], hint: "Menu cart and tickets" },
  { to: "/staff-portal/kitchen", label: "Kitchen", icon: "♨", roles: ["admin", "manager", "kitchen"], hint: "Live KDS queue" },
  { to: "/staff-portal/inventory", label: "Inventory", icon: "▥", roles: ["admin", "manager", "kitchen"], hint: "Stock and suppliers" },
  { to: "/staff-portal/billing", label: "Billing", icon: "₹", roles: ["admin", "manager", "cashier", "waiter"], hint: "Invoices and payments" },
  { to: "/staff-portal/team", label: "Team", icon: "☰", roles: ["admin", "manager"], hint: "Staff and roles" },
  { to: "/staff-portal/attendance", label: "Attendance", icon: "✓", roles: ["admin", "manager", "cashier", "kitchen", "waiter"], hint: "Shift check-ins" },
  { to: "/staff-portal/reports", label: "Reports", icon: "◔", roles: ["admin", "manager"], hint: "Revenue analytics" },
];

const TITLES = {
  "/staff-portal": ["Service Command", "Real-time restaurant operations at a glance"],
  "/staff-portal/reservations": ["Reservation Flow", "Bookings, walk-ins, seating and table states"],
  "/staff-portal/orders": ["Commerce Counter", "Browse menu, build carts and send tickets to kitchen"],
  "/staff-portal/kitchen": ["Kitchen Display", "Live production queue with status handoff"],
  "/staff-portal/inventory": ["Stock Studio", "Ingredients, low-stock alerts and supplier control"],
  "/staff-portal/billing": ["Invoice Desk", "Payments, tax, discounts and downloadable invoices"],
  "/staff-portal/team": ["Team Console", "Employees, roles and shift attendance"],
  "/staff-portal/attendance": ["Shift Check-in", "Mark and review your attendance records"],
  "/staff-portal/reports": ["Revenue Lab", "Sales and operational analytics"],
};

const useClock = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(id);
  }, []);
  return now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState(() => localStorage.getItem("tt-theme") || "dark");
  const time = useClock();
  const [title, sub] = TITLES[pathname] || ["TableTrack", "Restaurant ERP"];
  const links = useMemo(
    () => NAV.filter((n) => n.roles.includes(user?.role)),
    [user?.role]
  );
  const filteredLinks = links.filter((n) =>
    `${n.label} ${n.hint}`.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("tt-theme", theme);
  }, [theme]);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  const userInitial = user?.name?.[0]?.toUpperCase() || "T";

  return (
    <div className={`shell ${menuOpen ? "nav-open" : ""}`}>
      <button className="mobile-nav-toggle" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
        ☰
      </button>

      <aside className="sidebar">
        <Link to="/staff-portal" className="brand">
          <div className="brand-mark">T</div>
          <div>
            <div className="brand-name">TableTrack</div>
            <div className="brand-sub">Restaurant ERP</div>
          </div>
        </Link>

        <div className="nav-label">Operations</div>
        <nav className="nav">
          {links.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/staff-portal"}
              className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
            >
              <span className="nav-icon">{n.icon}</span>
              <span className="nav-text">
                <span>{n.label}</span>
                <small>{n.hint}</small>
              </span>
              {n.to === "/staff-portal/kitchen" && <span className="live-dot" aria-label="Live" />}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="user-chip">
            <div className="avatar">{userInitial}</div>
            <div>
              <div className="user-name">{user?.name || "Staff"}</div>
              <div className="user-role">{user?.role || "role"}</div>
            </div>
          </div>
          <div className="sidebar-actions">
            <Link className="customer-link" to="/customer">Guest portal</Link>
            <button className="logout-btn" onClick={logout}>Sign out</button>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-title">
            <h1 className="page-title">{title}</h1>
            {sub && <div className="page-sub">{sub}</div>}
          </div>
          <button className="command-search" onClick={() => setCommandOpen(true)}>
            <span>Search modules</span>
            <kbd>Ctrl K</kbd>
          </button>
          <div className="clock mono">{time}</div>
          <button
            className="icon-btn"
            onClick={() => setTheme((v) => (v === "dark" ? "light" : "dark"))}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <div className="topbar-pill">{user?.role} access</div>
        </header>
        <div className="content">{children}</div>
      </div>

      {commandOpen && (
        <div className="command-overlay" onClick={() => setCommandOpen(false)}>
          <div className="command-panel" onClick={(e) => e.stopPropagation()}>
            <div className="command-head">
              <span>Jump to module</span>
              <button className="x-btn" onClick={() => setCommandOpen(false)} aria-label="Close">×</button>
            </div>
            <input
              className="command-input"
              autoFocus
              placeholder="Search reservations, stock, billing…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="command-list">
              {filteredLinks.map((n) => (
                <Link key={n.to} className="command-row" to={n.to} onClick={() => setCommandOpen(false)}>
                  <span className="command-icon">{n.icon}</span>
                  <span>
                    <strong>{n.label}</strong>
                    <small>{n.hint}</small>
                  </span>
                </Link>
              ))}
              {filteredLinks.length === 0 && <div className="empty compact">No matching modules.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
