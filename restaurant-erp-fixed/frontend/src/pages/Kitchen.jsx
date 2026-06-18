import { useEffect, useState } from "react";
import api from "../api/axios.js";
import socket from "../api/socket.js";

const NEXT = { pending: "preparing", preparing: "ready", ready: "served" };
const NEXT_LABEL = {
  pending: "Start preparing",
  preparing: "Mark ready",
  ready: "Mark served",
};

export default function Kitchen() {
  const [orders, setOrders] = useState([]);

  const load = () => api.get("/orders/kitchen").then((r) => setOrders(r.data));

  useEffect(() => {
    load();

    // live updates: new orders appear, status changes reflect instantly
    const onNew = (order) =>
      setOrders((o) => (o.some((x) => x._id === order._id) ? o : [...o, order]));
    const onUpdate = (order) => {
      setOrders((o) => {
        // drop served/cancelled from the active queue
        if (["served", "cancelled"].includes(order.status)) {
          return o.filter((x) => x._id !== order._id);
        }
        return o.map((x) => (x._id === order._id ? order : x));
      });
    };

    socket.on("order:new", onNew);
    socket.on("order:update", onUpdate);
    return () => {
      socket.off("order:new", onNew);
      socket.off("order:update", onUpdate);
    };
  }, []);

  const advance = async (order) => {
    const status = NEXT[order.status];
    if (!status) return;
    await api.put(`/orders/${order._id}/status`, { status });
    // socket broadcast will update the UI, but update locally too for snappiness
  };

  const sorted = [...orders].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  return (
    <>
      <div className="section-head">
        <h3 className="section-title">
          Live queue
          <span
            style={{
              marginLeft: 10,
              fontSize: 12,
              color: "var(--st-ready)",
              fontWeight: 600,
            }}
          >
            ● updates in real time
          </span>
        </h3>
      </div>

      {sorted.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">♨</div>
          No active orders. New orders will appear here automatically.
        </div>
      ) : (
        <div className="kitchen-grid">
          {sorted.map((o) => (
            <div key={o._id} className={`ticket ${o.status}`}>
              <div className="ticket-head">
                <span className="ticket-no">{o.orderNumber}</span>
                <span className={`badge ${o.status}`}>{o.status}</span>
              </div>
              <div style={{ padding: "8px 16px 0", fontSize: 13, color: "var(--muted)" }}>
                {o.tableNumber ? `Table ${o.tableNumber}` : "Takeaway"} ·{" "}
                {new Date(o.createdAt).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="ticket-items">
                {o.items.map((it, i) => (
                  <div key={i} className="ticket-item">
                    <span>{it.name}</span>
                    <span className="ticket-qty">×{it.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="ticket-actions">
                {NEXT[o.status] && (
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, justifyContent: "center" }}
                    onClick={() => advance(o)}
                  >
                    {NEXT_LABEL[o.status]}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
