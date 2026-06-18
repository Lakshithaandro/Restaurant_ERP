import { useCallback, useEffect, useState } from "react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

const STATUS_META = {
  present: { label: "Present", cls: "confirmed" },
  absent:  { label: "Absent",  cls: "cancelled" },
  leave:   { label: "On Leave", cls: "pending" },
};

const todayStr = () => new Date().toLocaleDateString("en-IN", {
  weekday: "long", day: "numeric", month: "long", year: "numeric",
});

const shiftLabel = (s) =>
  s === "morning" ? "Morning" : s === "evening" ? "Evening" : "Night";

export default function Attendance() {
  const { user } = useAuth();
  const [records, setRecords]   = useState([]);
  const [todayRec, setTodayRec] = useState(null); // today's record if any
  const [busy, setBusy]         = useState(false);
  const [flash, setFlash]       = useState({ type: "", message: "" });
  const [shift, setShift]       = useState("morning");

  const note = useCallback((type, message, ms = 3000) => {
    setFlash({ type, message });
    setTimeout(() => setFlash({ type: "", message: "" }), ms);
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/staff/attendance/me");
      setRecords(res.data);
      // find today's record for the selected shift
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const todayEnd   = new Date(todayStart); todayEnd.setDate(todayEnd.getDate() + 1);
      const found = res.data.find((r) => {
        const d = new Date(r.date);
        return r.shift === shift && d >= todayStart && d < todayEnd;
      });
      setTodayRec(found || null);
    } catch {
      note("err", "Could not load your attendance.");
    }
  }, [note, shift]);

  useEffect(() => { load(); }, [load]); // reload when shift changes

  const mark = async (status) => {
    setBusy(true);
    try {
      await api.post("/staff/attendance/self", { shift, status });
      note("ok", `Marked as ${STATUS_META[status].label} for ${shiftLabel(shift)} shift.`);
      await load();
    } catch (err) {
      note("err", err.response?.data?.message || "Could not mark attendance.");
    } finally {
      setBusy(false);
    }
  };

  // summary counts for the last 30 days
  const summary = records.reduce(
    (acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; },
    {}
  );

  return (
    <>
      {flash.message && (
        <div className={`flash ${flash.type}`}>{flash.message}</div>
      )}

      {/* --- Today card --- */}
      <div className="section-head">
        <h3 className="section-title">My Attendance</h3>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>{todayStr()}</span>
      </div>

      <div className="card card-pad" style={{ marginBottom: "var(--gap)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            {user.name}
            <span className="badge role" style={{ marginLeft: 8 }}>{user.role}</span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>Shift:</label>
            <select
              className="input"
              style={{ width: "auto", padding: "6px 10px", fontSize: 13 }}
              value={shift}
              onChange={(e) => setShift(e.target.value)}
            >
              <option value="morning">Morning</option>
              <option value="evening">Evening</option>
              <option value="night">Night</option>
            </select>
          </div>
        </div>

        {todayRec ? (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 6 }}>
              Today&apos;s {shiftLabel(shift)} shift — current status:
            </div>
            <span className={`badge ${STATUS_META[todayRec.status]?.cls || ""}`} style={{ fontSize: 14, padding: "6px 14px" }}>
              {STATUS_META[todayRec.status]?.label || todayRec.status}
            </span>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
              You can update your status below until midnight.
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 20, fontSize: 13, color: "var(--muted)" }}>
            You haven&apos;t marked attendance for the <strong>{shiftLabel(shift)}</strong> shift yet today.
          </div>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            className="btn btn-primary"
            onClick={() => mark("present")}
            disabled={busy || todayRec?.status === "present"}
            style={{ minWidth: 120 }}
          >
            ✓ Present
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => mark("absent")}
            disabled={busy || todayRec?.status === "absent"}
            style={{ minWidth: 120 }}
          >
            ✗ Absent
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => mark("leave")}
            disabled={busy || todayRec?.status === "leave"}
            style={{ minWidth: 120 }}
          >
            On Leave
          </button>
        </div>
      </div>

      {/* --- Summary --- */}
      <div className="grid cards-4" style={{ marginBottom: "var(--gap)" }}>
        {[
          { key: "present", label: "Present days",  cls: "confirmed" },
          { key: "absent",  label: "Absent days",   cls: "cancelled" },
          { key: "leave",   label: "Leave days",    cls: "pending"   },
        ].map((s) => (
          <div key={s.key} className="card stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{summary[s.key] || 0}</div>
            <div className="stat-foot">Last 30 days</div>
          </div>
        ))}
        <div className="card stat-card">
          <div className="stat-label">Total records</div>
          <div className="stat-value">{records.length}</div>
          <div className="stat-foot">Last 30 days</div>
        </div>
      </div>

      {/* --- History table --- */}
      <div className="section-head">
        <h3 className="section-title">My attendance history</h3>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>Last 30 days</span>
      </div>
      <div className="card table-wrap">
        {records.length === 0 ? (
          <div className="empty">No attendance records yet. Mark yourself present to get started.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Shift</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r._id}>
                  <td>
                    {new Date(r.date).toLocaleDateString("en-IN", {
                      weekday: "short", day: "numeric", month: "short", year: "numeric",
                    })}
                  </td>
                  <td style={{ textTransform: "capitalize" }}>{shiftLabel(r.shift)}</td>
                  <td>
                    <span className={`badge ${STATUS_META[r.status]?.cls || ""}`}>
                      {STATUS_META[r.status]?.label || r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
