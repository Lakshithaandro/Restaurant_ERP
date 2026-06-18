import test from "node:test";
import assert from "node:assert/strict";
import { buildInvoiceHtml, invoiceFileName } from "../utils/invoiceHtml.js";

test("invoiceFileName returns a safe html filename", () => {
  assert.equal(invoiceFileName("INV/123 ABC"), "inv-123-abc.html");
});

test("buildInvoiceHtml includes escaped invoice and order data", () => {
  const html = buildInvoiceHtml({
    invoiceNumber: "INV-001<script>",
    order: {
      orderNumber: "ORD-1",
      items: [{ name: "Paneer <Tikka>", price: 220, quantity: 2 }],
    },
    tableNumber: 4,
    subtotal: 440,
    taxRate: 5,
    tax: 22,
    discount: 20,
    total: 442,
    paymentMethod: "upi",
    createdAt: "2026-06-14T10:00:00.000Z",
  });

  assert.match(html, /INV-001&lt;script&gt;/);
  assert.match(html, /Paneer &lt;Tikka&gt;/);
  assert.match(html, /₹442.00/);
});
