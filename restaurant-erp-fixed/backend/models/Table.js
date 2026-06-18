import mongoose from "mongoose";

const tableSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true, unique: true, min: 1 },
    seats: { type: Number, required: true, default: 2, min: 1, max: 50 },
    status: {
      type: String,
      enum: ["available", "occupied", "reserved"],
      default: "available",
    },
    location: { type: String, default: "Main Hall" },
  },
  { timestamps: true }
);

export default mongoose.model("Table", tableSchema);
