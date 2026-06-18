import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { isValidName, isOptionalPhone } from "../utils/validators.js";

export const ROLES = ["admin", "manager", "cashier", "kitchen", "waiter"];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isValidName,
        message: "Name cannot contain numbers and must be 2-60 letters.",
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address."],
    },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: "waiter" },
    phone: {
      type: String,
      default: "",
      validate: {
        validator: isOptionalPhone,
        message: "Phone must be exactly 10 digits.",
      },
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash the password before saving, only if it changed
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Helper to compare a plain password against the stored hash
userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

export default mongoose.model("User", userSchema);
