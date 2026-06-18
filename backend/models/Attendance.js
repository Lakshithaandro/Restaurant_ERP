import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    staff: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    shift: {
      type: String,
      enum: ["morning", "evening", "night"],
      default: "morning",
    },
    status: {
      type: String,
      enum: ["present", "absent", "leave"],
      default: "present",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Attendance", attendanceSchema);
