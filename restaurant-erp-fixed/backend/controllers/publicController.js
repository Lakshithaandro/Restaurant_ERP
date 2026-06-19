import MenuItem from "../models/MenuItem.js";
import Reservation from "../models/Reservation.js";
import Table from "../models/Table.js";
import { nameError, phoneError, normalizePhone } from "../utils/validators.js";

export const getPublicTables = async (req, res) => {
  const tables = await Table.find({ status: "available" }).sort("number");
  res.json(tables);
};

export const getPublicMenu = async (req, res) => {
  const menu = await MenuItem.find({ available: true }).sort("category name");
  res.json(menu);
};

// Customers track their booking from the portal using the phone number they
// booked with. Returns their recent reservations (most recent first) with just
// the details a guest needs to see.
export const lookupReservations = async (req, res) => {
  const phone = normalizePhone(req.query.phone);
  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({ message: "Enter the 10-digit number you booked with." });
  }
  const reservations = await Reservation.find({ phone })
    .populate("table", "number seats location")
    .sort({ date: -1, createdAt: -1 })
    .limit(10)
    .select("customerName partySize table date time type status notes createdAt");
  res.json(reservations);
};

export const createPublicReservation = async (req, res) => {
  const { customerName, phone, partySize, table, date, time, notes } = req.body;

  if (!customerName || !phone || !partySize || !date || !time) {
    return res.status(400).json({
      message: "Name, phone, party size, date and time are required.",
    });
  }

  // Validate the fields people get wrong most often, with friendly messages.
  const nameMsg = nameError(customerName, "Name");
  if (nameMsg) return res.status(400).json({ message: nameMsg });

  const phoneMsg = phoneError(phone, { required: true });
  if (phoneMsg) return res.status(400).json({ message: phoneMsg });

  if (Number(partySize) < 1) {
    return res.status(400).json({ message: "Party size must be at least 1." });
  }

  // Reject reservations whose date+time combination is already in the past.
  const reservationDateTime = new Date(`${date}T${time}`);
  if (isNaN(reservationDateTime.getTime())) {
    return res.status(400).json({ message: "Invalid date or time." });
  }
  if (reservationDateTime <= new Date()) {
    return res.status(400).json({
      message: "Reservation time must be in the future. Please choose a later time.",
    });
  }

  let selectedTable = null;
  if (table) {
    selectedTable = await Table.findOne({ _id: table, status: "available" });
    if (!selectedTable) {
      return res.status(400).json({ message: "Selected table is no longer available." });
    }
  }

  const reservation = await Reservation.create({
    customerName: customerName.trim(),
    phone: normalizePhone(phone),
    partySize,
    table: selectedTable?._id,
    date,
    time,
    type: "booking",
    status: "pending",
    notes,
  });

  if (selectedTable) {
    selectedTable.status = "reserved";
    await selectedTable.save();
  }

  const populated = await reservation.populate("table", "number seats");
  res.status(201).json(populated);
};
