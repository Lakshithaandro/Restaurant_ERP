import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
    name: String, // snapshot of name at order time
    price: Number, // snapshot of price at order time
    quantity: { type: Number, default: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    table: { type: mongoose.Schema.Types.ObjectId, ref: "Table" },
    tableNumber: Number, // snapshot for quick display
    items: [orderItemSchema],
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "served", "cancelled"],
      default: "pending",
    },
    total: { type: Number, default: 0 },
    billed: { type: Boolean, default: false },
    // Set once the dish ingredients have been pulled from inventory, so a
    // served order can never deduct stock twice.
    inventoryDeducted: { type: Boolean, default: false },
    placedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
