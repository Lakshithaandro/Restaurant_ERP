import { useState } from "react";
import { Link } from "react-router-dom";
import Modal from "./Modal.jsx";

const year = new Date().getFullYear();

/* ---------- tiny random helpers (placeholder data, fresh on every open) ---------- */
const rint = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rint(0, arr.length - 1)];
const inr = (n) => "₹" + Number(n).toLocaleString("en-IN");

const NAMES = ["Aarav", "Diya", "Kabir", "Ananya", "Vivaan", "Mira", "Reyansh", "Sara", "Ishaan", "Anika", "Arjun", "Tara"];
const DISHES = ["Paneer Tikka", "Butter Chicken", "Masala Dosa", "Hyderabadi Biryani", "Tandoori Platter", "Dal Makhani", "Hakka Noodles", "Gulab Jamun"];
const CITIES = ["Jaipur", "Mumbai", "Bengaluru", "Delhi", "Pune", "Hyderabad"];
const ROLES = ["Floor Manager", "Head Chef", "Cashier", "Waiter", "Sommelier", "Host"];
const time = () => `${rint(6, 10)}:${pick(["00", "15", "30", "45"])} PM`;

/* one generator per footer feature — returns { tag, rows:[label, value][] } */
const DATA = {
  Reservations: () => ({
    tag: "Live floor",
    rows: [
      ["Tables seated now", rint(6, 22)],
      ["Walk-ins waiting", rint(0, 6)],
      ["Avg. turn time", rint(38, 74) + " min"],
      ["Next booking", `${pick(NAMES)} · ${rint(2, 8)} pax · ${time()}`],
    ],
  }),
  Orders: () => ({
    tag: "Last 60 min",
    rows: [
      ["Open tickets", rint(4, 19)],
      ["Top seller", `${pick(DISHES)} · ${rint(8, 40)} sold`],
      ["Avg. ticket value", inr(rint(420, 1850))],
      ["Order #" + rint(8000, 8999), pick(["seated", "preparing", "ready", "billed"])],
    ],
  }),
  "Kitchen display": () => ({
    tag: "KDS queue",
    rows: [
      ["In the pass", rint(2, 12)],
      ["Avg. prep time", rint(7, 21) + " min"],
      ["Fired", `${pick(DISHES)} ×${rint(1, 4)}`],
      ["Station load", pick(["light", "steady", "slammed"])],
    ],
  }),
  Inventory: () => ({
    tag: "Stock pulse",
    rows: [
      ["SKUs tracked", rint(120, 340)],
      ["Low-stock alerts", rint(0, 9)],
      ["Reorder due", `${pick(["Paneer", "Basmati rice", "Tomatoes", "Olive oil"])} · ${rint(1, 6)}kg left`],
      ["Last delivery", rint(1, 5) + "h ago"],
    ],
  }),
  Billing: () => ({
    tag: "Today",
    rows: [
      ["Invoices issued", rint(40, 180)],
      ["Avg. bill", inr(rint(680, 2400))],
      ["Split UPI / Card / Cash", `${rint(40, 60)}% · ${rint(20, 35)}% · ${rint(10, 25)}%`],
      ["Pending bills", rint(0, 7)],
    ],
  }),
  Documentation: () => ({
    tag: "Docs",
    rows: [
      ["Guides published", rint(60, 140)],
      ["API endpoints", rint(70, 130)],
      ["Last updated", rint(1, 9) + " days ago"],
      ["Most read", pick(["Quickstart", "Webhooks", "Role permissions", "Invoice API"])],
    ],
  }),
  Changelog: () => ({
    tag: "Recent",
    rows: [
      ["v2." + rint(2, 9) + "." + rint(0, 12), "Faster kitchen sync"],
      ["v2." + rint(0, 1) + "." + rint(0, 9), "New billing splits"],
      ["Shipped this month", rint(4, 18) + " updates"],
      ["Open beta flags", rint(1, 6)],
    ],
  }),
  "API status": () => ({
    tag: "Systems",
    rows: [
      ["Uptime (30d)", (99 + Math.random()).toFixed(2) + "%"],
      ["Avg. latency", rint(40, 180) + " ms"],
      ["Region", pick(CITIES) + " edge"],
      ["Incidents (90d)", rint(0, 2)],
    ],
  }),
  "About us": () => ({
    tag: "Studio",
    rows: [
      ["Founded", rint(2019, 2023)],
      ["Restaurants live", rint(120, 980)],
      ["Cities", rint(8, 40)],
      ["HQ", pick(CITIES)],
    ],
  }),
  Careers: () => ({
    tag: "We're hiring",
    rows: [
      ["Open roles", rint(2, 11)],
      ["Spotlight", pick(["Product Designer", "Backend Engineer", "Support Lead", "Solutions Eng."])],
      ["Mode", pick(["On-site", "Hybrid", "Remote-first"])],
      ["Team size", rint(14, 80)],
    ],
  }),
  "Press kit": () => ({
    tag: "Media",
    rows: [
      ["Logos & assets", rint(8, 24) + " files"],
      ["Brand colors", "5 swatches"],
      ["Latest mention", pick(["YourStory", "Inc42", "ET Tech", "Hospitality World"])],
      ["Updated", rint(2, 11) + " weeks ago"],
    ],
  }),
  Contact: () => ({
    tag: "Reach us",
    rows: [
      ["Avg. reply", "under " + rint(2, 6) + "h"],
      ["Support hours", "9 AM – 11 PM IST"],
      ["Demo slots open", rint(1, 9)],
      ["Account manager", `${pick(NAMES)} · ${pick(ROLES)}`],
    ],
  }),
  Privacy: () => ({
    tag: "Policy",
    rows: [
      ["Last updated", `${rint(1, 28)} ${pick(["Jan", "Feb", "Mar", "Apr", "May", "Jun"])} ${year}`],
      ["Data residency", "India"],
      ["Retention", rint(12, 36) + " months"],
      ["Encryption", "AES-256 at rest"],
    ],
  }),
  Terms: () => ({
    tag: "Policy",
    rows: [
      ["Version", "v" + rint(2, 5) + "." + rint(0, 9)],
      ["Effective", `${rint(1, 28)} ${pick(["Jan", "Feb", "Mar"])} ${year}`],
      ["Plan tiers", rint(2, 4)],
      ["Notice period", rint(7, 30) + " days"],
    ],
  }),
  Security: () => ({
    tag: "Trust",
    rows: [
      ["Uptime SLA", "99.9%"],
      ["2FA enabled", rint(70, 99) + "% of staff"],
      ["Last pen-test", rint(1, 6) + " months ago"],
      ["Backups", "every " + rint(4, 12) + "h"],
    ],
  }),
  Cookies: () => ({
    tag: "Preferences",
    rows: [
      ["Essential", "always on"],
      ["Analytics cookies", rint(2, 6)],
      ["Third-party", rint(0, 3)],
      ["Consent stored", rint(30, 180) + " days"],
    ],
  }),
};

const COLUMNS = [
  { heading: "Product", items: ["Reservations", "Orders", "Kitchen display", "Inventory", "Billing"] },
  { heading: "Resources", items: ["Documentation", "Changelog", "API status"] },
  { heading: "Company", items: ["About us", "Careers", "Press kit", "Contact"] },
  { heading: "Legal", items: ["Privacy", "Terms", "Security", "Cookies"] },
];

export default function Footer() {
  const [active, setActive] = useState(null); // { name, tag, rows }

  const open = (name) => {
    const gen = DATA[name];
    if (!gen) return;
    const { tag, rows } = gen();
    setActive({ name, tag, rows });
  };

  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-lede">
          <span className="footer-brand">
            <span className="footer-brand-mark brand-mark">T</span> TableTrack
          </span>
          <p className="footer-tagline">
            The cinematic operations console for modern restaurants — reservations,
            orders, kitchen, stock and billing in one place.
          </p>
          <span className="footer-note">Click any link below for a live sample.</span>
        </div>

        <div className="footer-cols">
          {COLUMNS.map((col) => (
            <nav className="footer-col" key={col.heading} aria-label={col.heading}>
              <h4 className="footer-col-title">{col.heading}</h4>
              {col.items.map((name) => (
                <button
                  type="button"
                  className="footer-feature"
                  key={name}
                  onClick={() => open(name)}
                >
                  {name}
                </button>
              ))}
            </nav>
          ))}
        </div>
      </div>

      <div className="footer-bottom">
        <span className="footer-brand sm">
          <span className="footer-brand-mark brand-mark">T</span> TableTrack
        </span>
        <nav className="footer-links">
          <Link to="/" className="footer-link">Home</Link>
          <Link to="/customer" className="footer-link">Book a Table</Link>
          <Link to="/staff-login" className="footer-link">Staff Login</Link>
        </nav>
        <span className="footer-copy">© {year} TableTrack · All rights reserved.</span>
      </div>

      {active && (
        <Modal
          title={active.name}
          onClose={() => setActive(null)}
          footer={
            <button className="btn btn-ghost" onClick={() => setActive(null)}>
              Close
            </button>
          }
        >
          <div className="footer-data">
            <span className="footer-data-tag">{active.tag} · sample data</span>
            <dl className="footer-data-list">
              {active.rows.map(([label, value]) => (
                <div className="footer-data-row" key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Modal>
      )}
    </footer>
  );
}
