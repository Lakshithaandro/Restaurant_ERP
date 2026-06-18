import mongoose from "mongoose";

// One line of a dish's recipe: how much of an inventory ingredient is used
// per single serving, measured in that ingredient's own unit (kg, litre, ...).
const recipeLineSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    quantity: { type: Number, required: true, min: 0 }, // per serving
  },
  { _id: false }
);

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, default: "Main Course" },
    price: { type: Number, required: true, default: 0, min: 0 },
    description: { type: String, default: "" },
    available: { type: Boolean, default: true },
    // Ingredients consumed when this dish is served (auto-deducted from stock)
    recipe: { type: [recipeLineSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("MenuItem", menuItemSchema);
