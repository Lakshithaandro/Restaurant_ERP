import Invoice from "../models/Invoice.js";
import Order from "../models/Order.js";
import Table from "../models/Table.js";
import { buildInvoiceHtml, invoiceFileName } from "../utils/invoiceHtml.js";
import { deductInventoryForOrder } from "../utils/inventory.js";

const genInvoiceNumber = () =>
  "INV-" + Date.now().toString().slice(-6) + Math.floor(Math.random() * 90 + 10);

export const getInvoices = async (req, res) => {
  const invoices = await Invoice.find()
    .populate("cashier", "name")
    .sort("-createdAt");
  res.json(invoices);
};

// Orders that are served but not yet billed
export const getBillableOrders = async (req, res) => {
  const orders = await Order.find({
    status: { $in: ["ready", "served"] },
    billed: false,
  }).sort("createdAt");
  res.json(orders);
};

export const createInvoice = async (req, res) => {
  const { orderId, taxRate = 5, discount = 0, paymentMethod = "cash" } = req.body;

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.billed)
    return res.status(400).json({ message: "Order is already billed" });

  const rate = Number(taxRate);
  const disc = Number(discount);
  if (Number.isNaN(rate) || rate < 0 || rate > 100) {
    return res.status(400).json({ message: "Tax rate must be between 0 and 100." });
  }
  if (Number.isNaN(disc) || disc < 0) {
    return res.status(400).json({ message: "Discount cannot be negative." });
  }

  const allowedPaymentMethods = ["cash", "card", "upi", "unpaid"];
  if (!allowedPaymentMethods.includes(paymentMethod)) {
    return res.status(400).json({ message: "Invalid payment method." });
  }

  const subtotal = order.total;
  const tax = +((subtotal * rate) / 100).toFixed(2);
  if (disc > subtotal + tax) {
    return res
      .status(400)
      .json({ message: "Discount cannot be larger than the bill total." });
  }
  const total = +(subtotal + tax - disc).toFixed(2);

  const invoice = await Invoice.create({
    invoiceNumber: genInvoiceNumber(),
    order: order._id,
    tableNumber: order.tableNumber,
    subtotal,
    taxRate: rate,
    tax,
    discount: disc,
    total,
    paymentMethod,
    paid: paymentMethod !== "unpaid",
    cashier: req.user._id,
  });

  // close out the order and free the table
  order.billed = true;
  order.status = "served";
  // Ensure ingredients are pulled even if the order was billed straight from
  // "ready" without being marked served in the kitchen first (no double-pull).
  await deductInventoryForOrder(order);
  await order.save();
  if (order.table) {
    await Table.findByIdAndUpdate(order.table, { status: "available" });
  }

  res.status(201).json(invoice);
};


export const downloadInvoice = async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate("cashier", "name")
    .populate("order");

  if (!invoice) return res.status(404).json({ message: "Invoice not found" });

  const html = buildInvoiceHtml(invoice);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${invoiceFileName(invoice.invoiceNumber)}"`
  );
  res.send(html);
};
