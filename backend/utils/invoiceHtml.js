const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const safe = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const toDate = (value) =>
  new Date(value || Date.now()).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

export const invoiceFileName = (invoiceNumber = "invoice") =>
  `${String(invoiceNumber).replace(/[^a-z0-9_-]/gi, "-").toLowerCase()}.html`;

export function buildInvoiceHtml(invoice) {
  const order = invoice.order || {};
  const items = Array.isArray(order.items) ? order.items : [];
  const rows = items
    .map(
      (item) => `
        <tr>
          <td>${safe(item.name)}</td>
          <td>${money(item.price)}</td>
          <td>${safe(item.quantity)}</td>
          <td>${money(Number(item.price || 0) * Number(item.quantity || 0))}</td>
        </tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safe(invoice.invoiceNumber)} - Invoice</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; color: #102a2f; background: #f4f1ea; }
    .page { width: min(880px, calc(100% - 32px)); margin: 32px auto; background: #fffdf8; border: 1px solid #ded8cd; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 80px rgba(16, 42, 47, 0.16); }
    .hero { padding: 34px; color: white; background: linear-gradient(135deg, #073b42, #0d5c63 58%, #ff7a59); display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; }
    .brand { letter-spacing: .08em; font-size: 13px; text-transform: uppercase; opacity: .78; }
    h1 { margin: 8px 0 0; font-size: 38px; line-height: 1; }
    .pill { display: inline-block; padding: 8px 14px; border-radius: 999px; background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.24); font-weight: 700; }
    .body { padding: 34px; }
    .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 26px; }
    .box { border: 1px solid #e5ded0; border-radius: 16px; padding: 14px; background: #fffaf1; }
    .label { color: #6e7f80; font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; margin-bottom: 5px; }
    .value { font-weight: 800; }
    table { width: 100%; border-collapse: collapse; overflow: hidden; border-radius: 16px; }
    th { text-align: left; color: #6e7f80; font-size: 12px; letter-spacing: .06em; text-transform: uppercase; background: #f7f1e7; }
    th, td { padding: 14px 16px; border-bottom: 1px solid #ebe3d8; }
    td:nth-child(2), td:nth-child(3), td:nth-child(4), th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: right; }
    .totals { width: min(360px, 100%); margin-left: auto; margin-top: 22px; }
    .line { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid #ebe3d8; }
    .grand { font-size: 26px; font-weight: 900; color: #0d5c63; border-bottom: 0; }
    .foot { margin-top: 26px; color: #6e7f80; font-size: 13px; }
    .actions { padding: 0 34px 34px; }
    .print { border: 0; border-radius: 12px; padding: 12px 16px; background: #0d5c63; color: white; font-weight: 800; cursor: pointer; }
    @media print { body { background: white; } .page { margin: 0; width: 100%; box-shadow: none; border: 0; } .actions { display: none; } }
    @media (max-width: 680px) { .hero, .meta { grid-template-columns: 1fr; display: grid; } h1 { font-size: 30px; } }
  </style>
</head>
<body>
  <main class="page">
    <section class="hero">
      <div>
        <div class="brand">Restaurant ERP</div>
        <h1>Invoice</h1>
      </div>
      <div class="pill">${safe(invoice.invoiceNumber)}</div>
    </section>
    <section class="body">
      <div class="meta">
        <div class="box"><div class="label">Order</div><div class="value">${safe(order.orderNumber || "—")}</div></div>
        <div class="box"><div class="label">Table</div><div class="value">${invoice.tableNumber ? `Table ${safe(invoice.tableNumber)}` : "—"}</div></div>
        <div class="box"><div class="label">Issued</div><div class="value">${safe(toDate(invoice.createdAt))}</div></div>
      </div>

      <table aria-label="Invoice items">
        <thead><tr><th>Item</th><th>Price</th><th>Qty</th><th>Amount</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="4">No order items available.</td></tr>`}</tbody>
      </table>

      <div class="totals">
        <div class="line"><span>Subtotal</span><strong>${money(invoice.subtotal)}</strong></div>
        <div class="line"><span>Tax (${safe(invoice.taxRate)}%)</span><strong>${money(invoice.tax)}</strong></div>
        <div class="line"><span>Discount</span><strong>- ${money(invoice.discount)}</strong></div>
        <div class="line"><span>Payment</span><strong>${safe(invoice.paymentMethod || "unpaid").toUpperCase()}</strong></div>
        <div class="line grand"><span>Total</span><span>${money(invoice.total)}</span></div>
      </div>
      <p class="foot">Thank you for dining with us. Use your browser print option to save this invoice as a PDF.</p>
    </section>
    <div class="actions"><button class="print" onclick="window.print()">Print / Save as PDF</button></div>
  </main>
</body>
</html>`;
}
