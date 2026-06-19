import Reservation from "../models/Reservation.js";
import Table from "../models/Table.js";
import { nameError, phoneError, normalizePhone } from "../utils/validators.js";

// ---- Tables ----
export const getTables = async (req, res) => {
  const tables = await Table.find().sort("number");
  res.json(tables);
};

export const createTable = async (req, res) => {
  const table = await Table.create(req.body);
  res.status(201).json(table);
};

export const updateTable = async (req, res) => {
  const table = await Table.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!table) return res.status(404).json({ message: "Table not found" });
  res.json(table);
};

// ---- Reservations ----
export const getReservations = async (req, res) => {
  const reservations = await Reservation.find()
    .populate("table", "number seats")
    .sort({ date: -1, time: -1 });
  res.json(reservations);
};

export const createReservation = async (req, res) => {
  const nameMsg = nameError(req.body.customerName, "Customer name");
  if (nameMsg) return res.status(400).json({ message: nameMsg });

  const phoneMsg = phoneError(req.body.phone, { required: false });
  if (phoneMsg) return res.status(400).json({ message: phoneMsg });

  const data = {
    ...req.body,
    customerName: String(req.body.customerName).trim(),
    phone: normalizePhone(req.body.phone),
    createdBy: req.user._id,
  };
  const reservation = await Reservation.create(data);
  // mark table as reserved if one was assigned
  if (reservation.table) {
    await Table.findByIdAndUpdate(reservation.table, { status: "reserved" });
  }
  const populated = await reservation.populate("table", "number seats");
  res.status(201).json(populated);
};

export const updateReservation = async (req, res) => {
  const existing = await Reservation.findById(req.params.id);
  if (!existing) return res.status(404).json({ message: "Reservation not found" });

  const update = { ...req.body };
  if (update.customerName !== undefined) {
    const nameMsg = nameError(update.customerName, "Customer name");
    if (nameMsg) return res.status(400).json({ message: nameMsg });
    update.customerName = String(update.customerName).trim();
  }
  if (update.phone !== undefined) {
    const phoneMsg = phoneError(update.phone, { required: false });
    if (phoneMsg) return res.status(400).json({ message: phoneMsg });
    update.phone = normalizePhone(update.phone);
  }

  const oldTableId = existing.table ? String(existing.table) : "";
  const reservation = await Reservation.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  }).populate("table", "number seats");

  const newTableId = reservation.table ? String(reservation.table._id) : "";
  if (oldTableId && oldTableId !== newTableId) {
    await Table.findByIdAndUpdate(oldTableId, { status: "available" });
  }

  // sync table status with reservation status
  if (reservation.table) {
    let tableStatus = "reserved";
    if (reservation.status === "seated") tableStatus = "occupied";
    if (["completed", "cancelled"].includes(reservation.status))
      tableStatus = "available";
    await Table.findByIdAndUpdate(reservation.table._id, {
      status: tableStatus,
    });
  }
  res.json(reservation);
};

export const deleteReservation = async (req, res) => {
  const reservation = await Reservation.findByIdAndDelete(req.params.id);
  if (!reservation)
    return res.status(404).json({ message: "Reservation not found" });
  if (reservation.table) {
    await Table.findByIdAndUpdate(reservation.table, { status: "available" });
  }
  res.json({ message: "Reservation deleted" });
};
