import { useEffect, useState } from "react";
import api from "../api/axios.js";
import Modal from "../components/Modal.jsx";
import Field from "../components/Field.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  nameError,
  emailError,
  phoneError,
  passwordError,
  onlyDigits,
  isClean,
} from "../utils/validation.js";

const ROLES = ["admin", "manager", "cashier", "kitchen", "waiter"];
const blankStaff = { name: "", email: "", password: "", role: "waiter", phone: "" };

export default function Staff() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";

  const [staff, setStaff] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [flash, setFlash] = useState({ type: "", message: "" });
  const [form, setForm] = useState(blankStaff);
  const [editForm, setEditForm] = useState(null);
  const [touched, setTouched] = useState({});

  const load = () => {
    // BUG FIX #4a: was silently swallowing errors — added .catch() handler
    api
      .get("/staff")
      .then((r) => setStaff(r.data))
      .catch((err) => note("err", err.response?.data?.message || "Could not load staff list."));

    // BUG FIX #4b: attendance/all is admin-only — managers would get silent 403.
    // Guard with role check before calling; non-admins get an empty list gracefully.
    if (isAdmin) {
      api
        .get("/staff/attendance/all")
        .then((r) => setAttendance(r.data))
        .catch((err) => note("err", err.response?.data?.message || "Could not load attendance."));
    }
  };
  useEffect(load, []);

  const note = (type, message, ms = 3000) => {
    setFlash({ type, message });
    setTimeout(() => setFlash({ type: "", message: "" }), ms);
  };

  // --- add staff ---
  const addErrors = {
    name: nameError(form.name, "Name"),
    email: emailError(form.email),
    password: passwordError(form.password),
    phone: phoneError(form.phone, { required: false }),
  };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const blur = (k) => setTouched((t) => ({ ...t, [k]: true }));

  const openAdd = () => {
    setForm(blankStaff);
    setTouched({});
    setShowAdd(true);
  };

  const addStaff = async () => {
    setTouched({ name: true, email: true, password: true, phone: true });
    if (!isClean(addErrors)) return;
    try {
      await api.post("/auth/register", form);
      setShowAdd(false);
      load();
      note("ok", `${form.name} added to the team.`);
    } catch (err) {
      note("err", err.response?.data?.message || "Could not add staff.");
    }
  };

  // --- edit staff ---
  const editErrors = editForm
    ? {
        name: nameError(editForm.name, "Name"),
        phone: phoneError(editForm.phone, { required: false }),
      }
    : {};

  const openEdit = (s) => {
    setEditing(s._id);
    setEditForm({ name: s.name, role: s.role, phone: s.phone || "", active: s.active });
  };

  const saveEdit = async () => {
    if (!isClean(editErrors)) return;
    try {
      await api.put(`/staff/${editing}`, editForm);
      setEditing(null);
      setEditForm(null);
      load();
      note("ok", "Staff updated.");
    } catch (err) {
      note("err", err.response?.data?.message || "Could not update staff.");
    }
  };

  const removeStaff = async (s) => {
    if (!window.confirm(`Remove ${s.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/staff/${s._id}`);
      load();
      note("ok", `${s.name} removed.`);
    } catch (err) {
      note("err", err.response?.data?.message || "Could not remove staff.");
    }
  };

  const mark = async (staffId, status) => {
    try {
      await api.post("/staff/attendance", {
        staff: staffId,
        date: new Date(),
        shift: "morning",
        status,
      });
      load();
      note("ok", `Marked ${status}.`, 1800);
    } catch (err) {
      note("err", err.response?.data?.message || "Could not mark attendance.");
    }
  };

  return (
    <>
      {flash.message && <div className={`flash ${flash.type}`}>{flash.message}</div>}
      <div className="section-head">
        <h3 className="section-title">Employees</h3>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openAdd}>
            + Add staff
          </button>
        )}
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Phone</th>
              <th>Status</th>
              {isAdmin && <th>Mark attendance</th>}
              {isAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 5} style={{ textAlign: "center", color: "var(--muted)", padding: "2rem" }}>
                  No staff found.
                </td>
              </tr>
            ) : (
              staff.map((s) => (
                <tr key={s._id}>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td style={{ color: "var(--muted)" }}>{s.email}</td>
                  <td>
                    <span className="badge role">{s.role}</span>
                  </td>
                  <td>{s.phone || "—"}</td>
                  <td>
                    <span className={`badge ${s.active ? "available" : "cancelled"}`}>
                      {s.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {isAdmin && (
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => mark(s._id, "present")}
                      >
                        Present
                      </button>{" "}
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => mark(s._id, "absent")}
                      >
                        Absent
                      </button>
                    </td>
                  )}
                  {isAdmin && (
                    <td style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>
                        Edit
                      </button>{" "}
                      {s._id !== user._id && (
                        <button
                          className="btn btn-ghost btn-sm danger"
                          onClick={() => removeStaff(s)}
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isAdmin && (
        <div className="section">
          <div className="section-head">
            <h3 className="section-title">Recent attendance</h3>
          </div>
          <div className="card table-wrap">
            {attendance.length === 0 ? (
              <div className="empty">No attendance recorded yet.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Shift</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.slice(0, 15).map((a) => (
                    <tr key={a._id}>
                      <td>{a.staff?.name || "—"}</td>
                      <td>{new Date(a.date).toLocaleDateString("en-IN")}</td>
                      <td style={{ textTransform: "capitalize" }}>{a.shift}</td>
                      <td>
                        <span className={`badge ${a.status}`}>{a.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {showAdd && (
        <Modal
          title="Add staff member"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={addStaff}
              >
                Add
              </button>
            </>
          }
        >
          <Field label="Full name" error={touched.name ? addErrors.name : ""}>
            <input
              className="input"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              onBlur={() => blur("name")}
            />
          </Field>
          <Field label="Email" error={touched.email ? addErrors.email : ""}>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              onBlur={() => blur("email")}
            />
          </Field>
          <Field
            label="Temporary password"
            error={touched.password ? addErrors.password : ""}
            hint="At least 6 characters"
          >
            <input
              className="input"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              onBlur={() => blur("password")}
            />
          </Field>
          <div className="row">
            <Field label="Role">
              <select
                className="input"
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Phone"
              error={touched.phone ? addErrors.phone : ""}
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
          </div>
        </Modal>
      )}

      {editForm && (
        <Modal
          title="Edit staff member"
          onClose={() => {
            setEditing(null);
            setEditForm(null);
          }}
          footer={
            <>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setEditing(null);
                  setEditForm(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={saveEdit}
                disabled={!isClean(editErrors)}
              >
                Save
              </button>
            </>
          }
        >
          <Field label="Full name" error={editErrors.name}>
            <input
              className="input"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
          </Field>
          <div className="row">
            <Field label="Role">
              <select
                className="input"
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Phone" error={editErrors.phone} hint="10 digits (optional)">
              <input
                className="input"
                inputMode="numeric"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm({ ...editForm, phone: onlyDigits(e.target.value).slice(0, 10) })
                }
                placeholder="9876543210"
              />
            </Field>
          </div>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={editForm.active}
              onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
            />
            <span>Active (can log in)</span>
          </label>
        </Modal>
      )}
    </>
  );
}
