import { useEffect, useState } from "react";
import api from "../api/axios.js";
import Modal from "../components/Modal.jsx";
import { cleanInvoiceFileName, saveBlob } from "../utils/downloadInvoice.js";

const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

export default function Billing() {
  const [billable, setBillable] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [order, setOrder] = useState(null);
  const [taxRate, setTaxRate] = useState(5);
  const [discount, setDiscount] = useState(0);
  const [method, setMethod] = useState("cash");
  const [flash, setFlash] = useState({ type: "", message: "" });
  const [downloading, setDownloading] = useState("");
  const [generating, setGenerating] = useState(false);

  const flashMsg = (type, message, ms = 3500) => {
    setFlash({ type, message });
    setTimeout(() => setFlash({ type: "", message: "" }), ms);
  };

  const load = () => {
    api.get("/billing/billable").then((r) => setBillable(r.data));
    api.get("/billing").then((r) => setInvoices(r.data));
  };
  useEffect(load, []);

  const subtotal = order?.total || 0;
  const tax = +((subtotal * taxRate) / 100).toFixed(2);
  const grand = +(subtotal + tax - discount).toFixed(2);

  const download = async (invoice) => {
    setDownloading(invoice._id);
    try {
      const res = await api.get(`/billing/${invoice._id}/download`, {
        responseType: "blob",
      });
      saveBlob(res.data, cleanInvoiceFileName(invoice.invoiceNumber));
      flashMsg("ok", `Downloaded ${invoice.invoiceNumber}. Open it and print/save as PDF if needed.`);
    } catch {
      flashMsg("err", "Could not download the invoice. Please try again.");
    } finally {
      setDownloading("");
    }
  };

  const generate = async () => {
    if (discount > subtotal + tax) {
      flashMsg("err", "Discount cannot be larger than the bill total.");
      return;
    }
    setGenerating(true);
    try {
      const res = await api.post("/billing", {
        orderId: order._id,
        taxRate,
        discount,
        paymentMethod: method,
      });
      setOrder(null);
      setDiscount(0);
      setTaxRate(5);
      load();
      await download(res.data);
    } catch (err) {
      flashMsg("err", err.response?.data?.message || "Could not generate invoice.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      {flash.message && <div className={`flash ${flash.type}`}>{flash.message}</div>}
      <div className="section-head">
        <h3 className="section-title">Orders ready to bill</h3>
      </div>
      <div className="grid cards-3">
        {billable.length === 0 ? (
          <div className="card card-pad empty" style={{ gridColumn: "1/-1" }}>
            No orders waiting to be billed.
          </div>
        ) : (
          billable.map((o) => (
            <div key={o._id} className="card card-pad invoice-ready-card">
              <div className="invoice-card-head">
                <strong>{o.orderNumber}</strong>
                <span className={`badge ${o.status}`}>{o.status}</span>
              </div>
              <div className="invoice-card-meta">
                {o.tableNumber ? `Table ${o.tableNumber}` : "No table"}
              </div>
              <div className="invoice-card-total">{inr(o.total)}</div>
              <button className="btn btn-primary" onClick={() => setOrder(o)}>
                Generate invoice
              </button>
            </div>
          ))
        )}
      </div>

      <div className="section">
        <div className="section-head">
          <h3 className="section-title">Invoices</h3>
        </div>
        <div className="card table-wrap">
          {invoices.length === 0 ? (
            <div className="empty">No invoices yet.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Table</th>
                  <th>Subtotal</th>
                  <th>Tax</th>
                  <th>Discount</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Time</th>
                  <th>Download</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv._id}>
                    <td style={{ fontWeight: 700 }}>{inv.invoiceNumber}</td>
                    <td>{inv.tableNumber ? `Table ${inv.tableNumber}` : "—"}</td>
                    <td>{inr(inv.subtotal)}</td>
                    <td>{inr(inv.tax)}</td>
                    <td>{inr(inv.discount)}</td>
                    <td style={{ fontWeight: 800 }}>{inr(inv.total)}</td>
                    <td>
                      <span className="badge role" style={{ textTransform: "uppercase" }}>
                        {inv.paymentMethod}
                      </span>
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: 13 }}>
                      {new Date(inv.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => download(inv)}
                        disabled={downloading === inv._id}
                      >
                        {downloading === inv._id ? "Preparing…" : "Download"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {order && (
        <Modal
          title={`Invoice for ${order.orderNumber}`}
          onClose={() => setOrder(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setOrder(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={generate} disabled={generating}>
                {generating ? "Working…" : "Confirm, save & download"}
              </button>
            </>
          }
        >
          <div className="row">
            <div className="field">
              <label>Tax rate (%)</label>
              <input
                className="input"
                type="number"
                min="0"
                max="100"
                value={taxRate}
                onChange={(e) =>
                  setTaxRate(Math.min(100, Math.max(0, +e.target.value || 0)))
                }
              />
            </div>
            <div className="field">
              <label>Discount (₹)</label>
              <input
                className="input"
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(Math.max(0, +e.target.value || 0))}
              />
            </div>
          </div>
          <div className="field">
            <label>Payment method</label>
            <select
              className="input"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="unpaid">Unpaid (bill later)</option>
            </select>
          </div>
          <div className="invoice-summary">
            <Row label="Subtotal" value={inr(subtotal)} />
            <Row label={`Tax (${taxRate}%)`} value={inr(tax)} />
            <Row label="Discount" value={"– " + inr(discount)} />
            <Row label="Total" value={inr(grand)} big />
          </div>
        </Modal>
      )}
    </>
  );
}

function Row({ label, value, big }) {
  return (
    <div className={`invoice-row ${big ? "big" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
