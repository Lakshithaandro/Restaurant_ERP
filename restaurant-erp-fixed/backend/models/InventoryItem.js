import mongoose from "mongoose";

const inventoryItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    unit: { type: String, default: "kg" }, // kg, litre, pieces, etc.
    quantity: { type: Number, required: true, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 10, min: 0 },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    costPerUnit: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Virtual flag: true when stock has dropped to or below the threshold
inventoryItemSchema.virtual("isLow").get(function () {
  return this.quantity <= this.lowStockThreshold;
});

inventoryItemSchema.set("toJSON", { virtuals: true });
inventoryItemSchema.set("toObject", { virtuals: true });

export default mongoose.model("InventoryItem", inventoryItemSchema);
