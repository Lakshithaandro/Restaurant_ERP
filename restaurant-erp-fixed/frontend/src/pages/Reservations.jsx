import { useEffect, useState } from "react";
import api from "../api/axios.js";
import Modal from "../components/Modal.jsx";
import Field from "../components/Field.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { nameError, phoneError, onlyDigits, isClean } from "../utils/validation.js";

const STATUSES = ["pending", "confirmed", "seated", "completed", "cancelled"];
const LOCATIONS = ["Main Hall", "Window", "Patio", "Private Room", "Bar"];

const blankReservation = {
  customerName: "",
  phone: "",
  partySize: 2,
  table: "",
  date: new Date().toISOString().slice(0, 10),
  time: "19:00",
  type: "booking",
  notes: "",
};

export default function Reservations() {
  const { user } = useAuth();
  const canManageTables = ["admin", "manager"].includes(user.role);

  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [show, setShow] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [flash, setFlash] = useState("");
  const [form, setForm] = useState(blankReservation);
  const [tableForm, setTableForm] = useState({ number: "", seats: 4, location: "Main Hall" });
  const [touched, setTouched] = useState({});

  const load = () => {
    api.get("/reservations").then((r) => setReservations(r.data));
    api.get("/reservations/tables").then((r) => setTables(r.data));
  };
  useEffect(load, []);

  const errors = {
    customerName: nameError(form.customerName, "Customer name"),
    phone: phoneError(form.phone, { required: false }),
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const blur = (k) => setTouched((t) => ({ ...t, [k]: true }));

  const openNew = () => {
    setForm(blankReservation);
    setTouched({});
    setFlash("");
    setShow(true);
  };

  const create = async () => {
    setTouched({ customerName: true, phone: true });
    if (!isClean(errors)) return;
    try {
      await api.post("/reservations", form);
      setShow(false);
      load();
    } catch (err) {
      setFlash(err.response?.data?.message || "Could not create reservation.");
      setTimeout(() => setFlash(""), 3500);
    }
  };

  const setStatus = async (id, status) => {
    await api.put(`/reservations/${id}`, { status });
    load();
  };

  const addTable = async () => {
    try {
      await api.post("/reservations/tables", {
        number: +tableForm.number,
        seats: +tableForm.seats,
        location: tableForm.location,
      });
      setShowTable(false);
      setTableForm({ number: "", seats: 4, location: "Main Hall" });
      load();
    } catch (err) {
      setFlash(err.response?.data?.message || "Could not add table.");
      setTimeout(() => setFlash(""), 3500);
    }
  };

  return (
    <>
      {flash && <div className="flash err">{flash}</div>}

      {/* Tables overview */}
      <div className="section-head">
        <h3 className="section-title">Tables</h3>
        {canManageTables && (
          <button className="btn btn-ghost btn-sm" onClick={() => setShowTable(true)}>
            + Add table
          </button>
        )}
      </div>
      <div className="card card-pad">
        {tables.length === 0 ? (
          <div className="empty" style={{ padding: "20px" }}>No tables yet.</div>
        ) : (
          <div className="table-chips">
            {tables.map((t) => (
              <div key={t._id} className={`table-chip ${t.status}`}>
                <span className="table-chip-no">Table {t.number}</span>
                <span className="table-chip-seats">{t.seats} seats · {t.location}</span>
                <span className={`badge ${t.status}`}>{t.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reservations */}
      <div className="section-head section">
        <h3 className="section-title">All reservations</h3>
        <button className="btn btn-primary" onClick={openNew}>
          + New reservation
        </button>
      </div>

      <div className="card table-wrap">
        {reservations.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">▤</div>
            No reservations yet. Create the first one.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Party</th>
                <th>Table</th>
                <th>Date</th>
                <th>Time</th>
                <th>Type</th>
                <th>Status</th>
                <th>Update</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.customerName}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      {r.phone || "—"}
                    </div>
                  </td>
                  <td>{r.partySize}</td>
                  <td>{r.table ? `Table ${r.table.number}` : "—"}</td>
                  <td>{new Date(r.date).toLocaleDateString("en-IN")}</td>
                  <td>{r.time}</td>
                  <td style={{ textTransform: "capitalize" }}>{r.type}</td>
                  <td>
                    <span className={`badge ${r.status}`}>{r.status}</span>
                  </td>
                  <td>
                    <select
                      className="input"
                      style={{ padding: "6px 10px", fontSize: 13 }}
                      value={r.status}
                      onChange={(e) => setStatus(r._id, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {show && (
        <Modal
          title="New reservation"
          onClose={() => setShow(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShow(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={create}
                disabled={!isClean(errors)}
              >
                Create
              </button>
            </>
          }
        >
          <Field label="Customer name" error={touched.customerName ? errors.customerName : ""}>
            <input
              className="input"
              value={form.customerName}
              onChange={(e) => set("customerName", e.target.value)}
              onBlur={() => blur("customerName")}
            />
          </Field>
          <div className="row">
            <Field
              label="Phone"
              error={touched.phone ? errors.phone : ""}
              hint="10 digits (optional)"
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
          <Field label="Table">
            <select
              className="input"
              value={form.table}
              onChange={(e) => set("table", e.target.value)}
            >
              <option value="">No table assigned</option>
              {tables.map((t) => (
                <option key={t._id} value={t._id}>
                  Table {t.number} ({t.seats} seats, {t.status})
                </option>
              ))}
            </select>
          </Field>
          <div className="row">
            <Field label="Date">
              <input
                className="input"
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </Field>
            <Field label="Time">
              <input
                className="input"
                type="time"
                value={form.time}
                onChange={(e) => set("time", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Type">
            <select
              className="input"
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
            >
              <option value="booking">Booking</option>
              <option value="walk-in">Walk-in</option>
            </select>
          </Field>
        </Modal>
      )}

      {showTable && (
        <Modal
          title="Add table"
          onClose={() => setShowTable(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowTable(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={addTable}
                disabled={!tableForm.number || +tableForm.number < 1}
              >
                Add table
              </button>
            </>
          }
        >
          <div className="row">
            <Field label="Table number">
              <input
                className="input"
                type="number"
                min="1"
                value={tableForm.number}
                onChange={(e) =>
                  setTableForm({ ...tableForm, number: e.target.value })
                }
                placeholder="7"
              />
            </Field>
            <Field label="Seats">
              <input
                className="input"
                type="number"
                min="1"
                max="50"
                value={tableForm.seats}
                onChange={(e) =>
                  setTableForm({ ...tableForm, seats: Math.max(1, +e.target.value || 1) })
                }
              />
            </Field>
          </div>
          <Field label="Location">
            <select
              className="input"
              value={tableForm.location}
              onChange={(e) =>
                setTableForm({ ...tableForm, location: e.target.value })
              }
            >
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
        </Modal>
      )}
    </>
  );
}
