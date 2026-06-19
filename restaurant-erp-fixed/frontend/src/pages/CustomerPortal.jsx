import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import Field from "../components/Field.jsx";
import { nameError, phoneError, onlyDigits } from "../utils/validation.js";
import Footer from "../components/Footer.jsx";

const getToday = () => new Date().toISOString().slice(0, 10);
const getNow = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

const STEPS = [
  { key: "pending", label: "Requested" },
  { key: "confirmed", label: "Confirmed" },
  { key: "seated", label: "Seated" },
  { key: "completed", label: "Completed" },
];
const ACTIVE = ["pending", "confirmed", "seated"];

function StatusBar({ status }) {
  if (status === "cancelled") {
    return <div className="track-cancelled">This reservation was cancelled.</div>;
  }
  const current = STEPS.findIndex((s) => s.key === status);
  return (
    <div className="stepper">
      {STEPS.map((s, i) => (
        <div
          key={s.key}
          className={`step ${i < current ? "done" : ""} ${i === current ? "current" : ""}`}
        >
          <span className="step-dot">{i < current ? "✓" : i + 1}</span>
          <span className="step-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function CustomerPortal() {
  const [tables, setTables] = useState([]);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState({});
  const [flash, setFlash] = useState({ type: "", message: "" });
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    partySize: 2,
    table: "",
    date: getToday(),
    time: "19:00",
    notes: "",
  });

  // booking tracker
  const [trackPhone, setTrackPhone] = useState("");
  const [tracked, setTracked] = useState(null); // null = not searched yet
  const [trackErr, setTrackErr] = useState("");
  const [trackBusy, setTrackBusy] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    Promise.all([api.get("/public/tables"), api.get("/public/menu")])
      .then(([tableRes, menuRes]) => {
        setTables(tableRes.data);
        setMenu(menuRes.data);
      })
      .catch(() =>
        setFlash({ type: "err", message: "Could not load booking data right now." })
      )
      .finally(() => setLoading(false));
    return () => clearInterval(pollRef.current);
  }, []);

  const featured = menu.slice(0, 6);

  const isToday = form.date === getToday();
  const errors = {
    customerName: nameError(form.customerName, "Name"),
    phone: phoneError(form.phone, { required: true }),
    time: isToday && form.time <= getNow()
      ? "Reservation time must be in the future."
      : "",
  };
  const valid = !errors.customerName && !errors.phone && !errors.time;

  const matchingTables = useMemo(
    () => tables.filter((t) => Number(t.seats) >= Number(form.partySize || 1)),
    [tables, form.partySize]
  );

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const blur = (key) => setTouched((t) => ({ ...t, [key]: true }));

  const submit = async (e) => {
    e.preventDefault();
    setTouched({ customerName: true, phone: true, time: true });
    if (!valid) return;
    setFlash({ type: "", message: "" });
    setBusy(true);
    try {
      const res = await api.post("/public/reservations", form);
      setFlash({
        type: "ok",
        message: `Thanks ${res.data.customerName}! Your request was received. Track it below using ${form.phone}.`,
      });
      // auto-fill the tracker with the number they just booked with
      setTrackPhone(form.phone);
      runTrack(form.phone);
      setForm({ ...form, customerName: "", phone: "", notes: "", table: "" });
      setTouched({});
      const tableRes = await api.get("/public/tables");
      setTables(tableRes.data);
    } catch (err) {
      setFlash({
        type: "err",
        message: err.response?.data?.message || "Could not create reservation.",
      });
    } finally {
      setBusy(false);
    }
  };

  // ---- booking tracker ----
  const runTrack = async (phoneValue) => {
    const phone = onlyDigits(phoneValue ?? trackPhone);
    if (phone.length !== 10) {
      setTrackErr("Enter the 10-digit number you booked with.");
      return;
    }
    setTrackErr("");
    setTrackBusy(true);
    try {
      const res = await api.get("/public/reservations/lookup", { params: { phone } });
      setTracked(res.data);
      // keep results fresh while the guest watches the screen
      clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const r = await api.get("/public/reservations/lookup", { params: { phone } });
          setTracked(r.data);
        } catch { /* ignore transient errors during polling */ }
      }, 20000);
    } catch (err) {
      setTracked([]);
      setTrackErr(err.response?.data?.message || "Could not look up your booking.");
    } finally {
      setTrackBusy(false);
    }
  };

  const activeOne = (tracked || []).find((r) => ACTIVE.includes(r.status));
  const isSeated = activeOne?.status === "seated";

  return (
    <>
    <main className="customer-page">
      <header className="customer-nav">
        <Link className="mini-brand" to="/">
          <span className="brand-mark">T</span>
          <span>TableTrack</span>
        </Link>
        <Link className="btn btn-ghost" to="/staff-login">
          Staff login
        </Link>
      </header>

      <section className="customer-hero">
        <div className="customer-copy">
          <div className="eyebrow">Guest experience</div>
          <h1>Reserve your table without waiting on a call.</h1>
          <p>
            Choose your date, time and party size. Your booking goes straight to
            the restaurant ERP reservation calendar, and you can track its status
            anytime with your phone number.
          </p>
          <div className="hero-metrics">
            <span><strong>{tables.length}</strong> tables open</span>
            <span><strong>{menu.length}</strong> dishes on the menu</span>
          </div>
        </div>

        <form className="booking-card" onSubmit={submit} noValidate>
          <h2>Book a table</h2>
          {flash.message && <div className={`flash ${flash.type}`}>{flash.message}</div>}

          <Field label="Name" error={touched.customerName ? errors.customerName : ""}>
            <input
              className="input"
              value={form.customerName}
              onChange={(e) => set("customerName", e.target.value)}
              onBlur={() => blur("customerName")}
              placeholder="Your full name"
            />
          </Field>

          <div className="row">
            <Field
              label="Phone"
              error={touched.phone ? errors.phone : ""}
              hint="10-digit mobile number"
            >
              <input
                className="input"
                inputMode="numeric"
                value={form.phone}
                onChange={(e) => set("phone", onlyDigits(e.target.value).slice(0, 10))}
                onBlur={() => blur("phone")}
                placeholder="9876543210"
              />
            </Field>
            <Field label="Party size">
              <input
                className="input"
                type="number"
                min="1"
                max="50"
                value={form.partySize}
                onChange={(e) => set("partySize", Math.max(1, +e.target.value || 1))}
              />
            </Field>
          </div>

          <div className="row">
            <Field label="Date">
              <input
                className="input"
                type="date"
                min={getToday()}
                value={form.date}
                onChange={(e) => {
                  set("date", e.target.value);
                  setTouched((t) => ({ ...t, time: true }));
                }}
                required
              />
            </Field>
            <Field label="Time" error={touched.time ? errors.time : ""}>
              <input
                className="input"
                type="time"
                min={isToday ? getNow() : undefined}
                value={form.time}
                onChange={(e) => set("time", e.target.value)}
                onBlur={() => blur("time")}
                required
              />
            </Field>
          </div>

          <Field label="Preferred table">
            <select
              className="input"
              value={form.table}
              onChange={(e) => set("table", e.target.value)}
              disabled={loading}
            >
              <option value="">Assign best available table</option>
              {matchingTables.map((table) => (
                <option key={table._id} value={table._id}>
                  Table {table.number} • {table.seats} seats • {table.location}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Notes">
            <textarea
              className="input"
              rows="3"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Birthday, high chair, dietary note..."
            />
          </Field>

          <button
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            disabled={busy || !valid}
          >
            {busy ? "Sending…" : "Send reservation request"}
          </button>
        </form>
      </section>

      {/* ---- Track your booking ---- */}
      <section className="track-section">
        <div className="track-card">
          <div className="track-head">
            <div>
              <div className="eyebrow dark">Live status</div>
              <h2>Track your booking</h2>
              <p>Enter the mobile number you booked with to see your table status.</p>
            </div>
          </div>
          <div className="track-form">
            <input
              className="input"
              inputMode="numeric"
              value={trackPhone}
              onChange={(e) => setTrackPhone(onlyDigits(e.target.value).slice(0, 10))}
              onKeyDown={(e) => e.key === "Enter" && runTrack()}
              placeholder="Your 10-digit number"
            />
            <button
              className="btn btn-primary"
              onClick={() => runTrack()}
              disabled={trackBusy || trackPhone.length !== 10}
            >
              {trackBusy ? "Checking…" : "Check status"}
            </button>
          </div>
          {trackErr && <div className="flash err" style={{ marginTop: 12 }}>{trackErr}</div>}

          {tracked && tracked.length === 0 && !trackErr && (
            <div className="empty" style={{ padding: "26px" }}>
              No bookings found for that number.
            </div>
          )}

          {tracked && tracked.length > 0 && (
            <div className="track-results">
              {tracked.map((r) => (
                <div key={r._id} className="track-item">
                  <div className="track-item-top">
                    <div>
                      <div className="track-name">{r.customerName}</div>
                      <div className="track-meta">
                        {new Date(r.date).toLocaleDateString("en-IN", {
                          weekday: "short", day: "numeric", month: "short",
                        })}{" "}
                        · {r.time} · party of {r.partySize}
                        {r.table ? ` · Table ${r.table.number}` : ""}
                      </div>
                    </div>
                    <span className={`badge ${r.status}`}>{r.status}</span>
                  </div>
                  <StatusBar status={r.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---- Menu: full & read-only once seated, otherwise a featured preview ---- */}
      <section className="featured-menu">
        <div className="section-head">
          <h2>{isSeated ? "Your menu" : "Featured menu"}</h2>
        </div>

        {isSeated && (
          <div className="seated-note">
            You’re seated at {activeOne.table ? `Table ${activeOne.table.number}` : "your table"}.
            Browse the full menu below — our staff will take and place your order for you.
          </div>
        )}

        <div className="menu-grid public-menu">
          {(isSeated ? menu : featured).map((item) => (
            <article key={item._id} className="menu-tile readonly">
              <div className="menu-cat">{item.category}</div>
              <div className="menu-name">{item.name}</div>
              <p>{item.description || "Freshly prepared by the kitchen team."}</p>
              <div className="menu-price">{inr(item.price)}</div>
            </article>
          ))}
        </div>
      </section>
    </main>
    <Footer />
    </>
  );
}
