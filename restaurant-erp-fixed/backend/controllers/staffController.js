import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import { nameError, phoneError, normalizePhone } from "../utils/validators.js";

// ---- Staff (users who are employees) ----
export const getStaff = async (req, res) => {
  const staff = await User.find().sort("name");
  res.json(staff);
};

export const updateStaff = async (req, res) => {
  const { name, role, phone, active } = req.body;

  if (name !== undefined) {
    const nameMsg = nameError(name, "Name");
    if (nameMsg) return res.status(400).json({ message: nameMsg });
  }
  if (phone !== undefined) {
    const phoneMsg = phoneError(phone, { required: false });
    if (phoneMsg) return res.status(400).json({ message: phoneMsg });
  }

  const update = {};
  if (name !== undefined) update.name = name.trim();
  if (role !== undefined) update.role = role;
  if (phone !== undefined) update.phone = normalizePhone(phone);
  if (active !== undefined) update.active = active;

  const staff = await User.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  });
  if (!staff) return res.status(404).json({ message: "Staff not found" });
  res.json(staff);
};

export const deleteStaff = async (req, res) => {
  // Don't let an admin delete their own account and lock themselves out.
  if (String(req.params.id) === String(req.user._id)) {
    return res
      .status(400)
      .json({ message: "You cannot remove your own account." });
  }
  const staff = await User.findByIdAndDelete(req.params.id);
  if (!staff) return res.status(404).json({ message: "Staff not found" });
  res.json({ message: "Staff removed" });
};

// ---- Self-service attendance (any staff member, own record only) ----

// Returns the logged-in user's attendance for the last 30 days.
export const getMyAttendance = async (req, res) => {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const records = await Attendance.find({ staff: req.user._id, date: { $gte: since } })
    .sort("-date")
    .populate("staff", "name role");
  res.json(records);
};

// Lets a staff member mark only themselves present/absent for today.
export const markSelfAttendance = async (req, res) => {
  const { shift = "morning", status = "present" } = req.body;
  const allowedStatuses = ["present", "absent", "leave"];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status." });
  }

  const now = new Date();
  const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);

  const record = await Attendance.findOneAndUpdate(
    { staff: req.user._id, shift, date: { $gte: dayStart, $lt: dayEnd } },
    { staff: req.user._id, shift, status, date: now },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).populate("staff", "name role");

  res.status(201).json(record);
};
export const getAttendance = async (req, res) => {
  const records = await Attendance.find()
    .populate("staff", "name role")
    .sort("-date");
  res.json(records);
};

export const markAttendance = async (req, res) => {
  const { staff, date, shift = "morning", status = "present" } = req.body;
  if (!staff) return res.status(400).json({ message: "Staff is required." });

  // One record per staff member, per day, per shift: mark again to update it
  // instead of piling up duplicate rows.
  const day = new Date(date || Date.now());
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const record = await Attendance.findOneAndUpdate(
    { staff, shift, date: { $gte: dayStart, $lt: dayEnd } },
    { staff, shift, status, date: day },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).populate("staff", "name role");

  res.status(201).json(record);
};
