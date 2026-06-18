import mongoose from "mongoose";
import { isValidName, isOptionalPhone } from "../utils/validators.js";

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contactPerson: {
      type: String,
      default: "",
      validate: {
        validator: (v) => !v || isValidName(v),
        message: "Contact person cannot contain numbers.",
      },
    },
    phone: {
      type: String,
      default: "",
      validate: {
        validator: isOptionalPhone,
        message: "Phone must be exactly 10 digits.",
      },
    },
    email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        message: "Enter a valid email address.",
      },
    },
    address: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Supplier", supplierSchema);
