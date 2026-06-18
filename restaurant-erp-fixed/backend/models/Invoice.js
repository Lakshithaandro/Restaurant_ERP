import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    tableNumber: Number,
    subtotal: { type: Number, default: 0 },
    taxRate: { type: Number, default: 5 }, // percent
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 }, // flat amount
    total: { type: Number, default: 0 },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi", "unpaid"],
      default: "unpaid",
    },
    paid: { type: Boolean, default: false },
    cashier: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Invoice", invoiceSchema);
