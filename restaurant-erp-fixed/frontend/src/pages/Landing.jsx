import { Link } from "react-router-dom";
import Footer from "../components/Footer.jsx";

const modules = [
  ["Reservations", "Table map, walk-ins, guest tracker", "▤"],
  ["Commerce orders", "Menu cart, recipes, stock deduction", "▣"],
  ["Kitchen rail", "Live tickets and production status", "♨"],
  ["Inventory", "Suppliers, thresholds, low-stock alerts", "▥"],
  ["Billing", "Tax, discounts, invoices and downloads", "₹"],
  ["Team", "Roles, shifts and attendance", "✓"],
];

export default function Landing() {
  return (
    <>
      <main className="portal-home">
        <section className="portal-hero">
          <div className="hero-copy">
            <div className="eyebrow">Premium restaurant ERP</div>
            <h1>Operate your restaurant like a high-end commerce brand.</h1>
            <p>
              TableTrack keeps reservations, table flow, menu sales, kitchen queue,
              stock, invoices, staff and reports together in one cinematic operations
              console built for real restaurant workflows.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary btn-lg" to="/customer">
                Book a table
              </Link>
              <Link className="btn btn-glass btn-lg" to="/staff-login">
                Enter staff ERP
              </Link>
            </div>
          </div>
        </section>

        <section className="portal-section">
          <div className="section-kicker">Choose the experience</div>
          <div className="portal-stack" aria-label="Portal choices">
            <Link to="/customer" className="portal-card customer-card">
              <span className="portal-icon">✦</span>
              <div>
                <h2>Customer Portal</h2>
                <p>Guests book tables, track reservation status and browse the menu once seated.</p>
              </div>
            </Link>
            <Link to="/staff-login" className="portal-card staff-card">
              <span className="portal-icon">▣</span>
              <div>
                <h2>Staff Portal</h2>
                <p>Admins, managers, cashiers, kitchen staff and waiters use role-based tools.</p>
              </div>
            </Link>
          </div>
        </section>

        <section className="module-strip">
          {modules.map(([title, body, icon]) => (
            <article className="module-card" key={title}>
              <span>{icon}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </>
  );
}
