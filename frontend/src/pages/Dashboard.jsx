import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios.js";

const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

const dashboardDefaults = {
  todaysRevenue: 0,
  ordersToday: 0,
  activeReservations: 0,
  lowStockCount: 0,
  lowStockItems: [],
  popularItems: [],
};

const normalizeDashboardData = (payload = {}) => ({
  ...dashboardDefaults,
  ...payload,
  todaysRevenue: Number(payload.todaysRevenue || 0),
  ordersToday: Number(payload.ordersToday || 0),
  activeReservations: Number(payload.activeReservations || 0),
  lowStockCount: Number(payload.lowStockCount || 0),
  lowStockItems: Array.isArray(payload.lowStockItems) ? payload.lowStockItems : [],
  popularItems: Array.isArray(payload.popularItems) ? payload.popularItems : [],
});

const quickLinks = [
  ["New order", "/staff-portal/orders", "▣"],
  ["Seat guests", "/staff-portal/reservations", "▤"],
  ["Kitchen queue", "/staff-portal/kitchen", "♨"],
  ["Create invoice", "/staff-portal/billing", "₹"],
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard")
      .then((res) => setData(normalizeDashboardData(res.data)))
      .catch((err) => {
        console.error("[dashboard] load failed", err.response?.data || err.message);
        setError("Could not load dashboard data. Please refresh.");
      });
  }, []);

  if (error) return <div className="flash err">{error}</div>;

  if (!data)
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );

  const cards = [
    { label: "Revenue today", value: inr(data.todaysRevenue), foot: "Paid invoices", icon: "₹", tone: "ember" },
    { label: "Orders today", value: data.ordersToday, foot: "Kitchen + served", icon: "▣", tone: "sky" },
    { label: "Active reservations", value: data.activeReservations, foot: "Pending to seated", icon: "▤", tone: "leaf" },
    { label: "Low-stock items", value: data.lowStockCount, foot: "Need reorder", icon: "▥", tone: "rose" },
  ];

  const maxSold = Math.max(...data.popularItems.map((p) => p.qty), 1);

  return (
    <>
      <section className="dashboard-hero card card-pad">
        <div>
          <div className="eyebrow dark">Today’s service pulse</div>
          <h2>Everything that matters before the next rush.</h2>
          <p>
            Use this command view to jump into live restaurant workflows while keeping revenue,
            bookings, production and stock health visible.
          </p>
        </div>
        <div className="quick-actions">
          {quickLinks.map(([label, to, icon]) => (
            <Link className="quick-action" to={to} key={to}>
              <span>{icon}</span>
              {label}
            </Link>
          ))}
        </div>
      </section>

      <div className="grid cards-4 section-tight">
        {cards.map((c) => (
          <div key={c.label} className={`card stat-card tone-${c.tone}`}>
            <span className="stat-accent">{c.icon}</span>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{c.value}</div>
            <div className="stat-foot">{c.foot}</div>
          </div>
        ))}
      </div>

      <div className="grid cards-2 section">
        <div className="card card-pad">
          <div className="section-head">
            <h3 className="section-title">Popular items today</h3>
            <span className="live-tag"><i /> Sales mix</span>
          </div>
          {data.popularItems.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">▣</div>
              No orders placed yet today.
            </div>
          ) : (
            <div className="rank-list">
              {data.popularItems.map((p, i) => (
                <div className="rank-row" key={p.name}>
                  <span className="rank-no">{i + 1}</span>
                  <span className="rank-name">{p.name}</span>
                  <span className="rank-meter"><i style={{ width: `${(p.qty / maxSold) * 100}%` }} /></span>
                  <strong>{p.qty} sold</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card card-pad">
          <div className="section-head">
            <h3 className="section-title">Low-stock alerts</h3>
            <Link className="btn btn-ghost btn-sm" to="/staff-portal/inventory">Open stock</Link>
          </div>
          {data.lowStockItems.length === 0 ? (
            <div className="empty success-empty">
              <div className="empty-icon">✓</div>
              Everything is well stocked.
            </div>
          ) : (
            <div className="stock-alerts">
              {data.lowStockItems.map((it) => (
                <div className="stock-alert" key={it.name}>
                  <span>{it.name}</span>
                  <strong>{it.quantity} left</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
