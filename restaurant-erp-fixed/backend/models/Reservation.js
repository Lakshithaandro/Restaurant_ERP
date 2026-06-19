import mongoose from "mongoose";
import { isValidName, isOptionalPhone } from "../utils/validators.js";

const reservationSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isValidName,
        message: "Customer name cannot contain numbers.",
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
    partySize: { type: Number, required: true, default: 2, min: 1, max: 50 },
    table: { type: mongoose.Schema.Types.ObjectId, ref: "Table" },
    date: { type: Date, required: true },
    time: { type: String, required: true }, // e.g. "19:30"
    type: { type: String, enum: ["booking", "walk-in"], default: "booking" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "seated", "completed", "cancelled"],
      default: "pending",
    },
    notes: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Reservation", reservationSchema);
