import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import mongoose from "mongoose";

import User from "../models/User.js";
import Table from "../models/Table.js";
import MenuItem from "../models/MenuItem.js";
import InventoryItem from "../models/InventoryItem.js";
import Supplier from "../models/Supplier.js";
import Reservation from "../models/Reservation.js";
import Order from "../models/Order.js";
import Invoice from "../models/Invoice.js";
import Attendance from "../models/Attendance.js";

dotenv.config();

const run = async () => {
  await connectDB();

  console.log("Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Table.deleteMany({}),
    MenuItem.deleteMany({}),
    InventoryItem.deleteMany({}),
    Supplier.deleteMany({}),
    Reservation.deleteMany({}),
    Order.deleteMany({}),
    Invoice.deleteMany({}),
    Attendance.deleteMany({}),
  ]);

  console.log("Creating users...");
  // create() runs the pre-save hook so passwords get hashed
  await User.create([
    { name: "Admin User", email: "admin@restaurant.com", password: "admin123", role: "admin" },
    { name: "Maya Manager", email: "manager@restaurant.com", password: "manager123", role: "manager" },
    { name: "Carl Cashier", email: "cashier@restaurant.com", password: "cashier123", role: "cashier" },
    { name: "Kira Kitchen", email: "kitchen@restaurant.com", password: "kitchen123", role: "kitchen" },
    { name: "Will Waiter", email: "waiter@restaurant.com", password: "waiter123", role: "waiter" },
  ]);

  console.log("Creating tables...");
  const tables = await Table.create([
    { number: 1, seats: 2, location: "Window" },
    { number: 2, seats: 4, location: "Main Hall" },
    { number: 3, seats: 4, location: "Main Hall" },
    { number: 4, seats: 6, location: "Patio" },
    { number: 5, seats: 2, location: "Window" },
    { number: 6, seats: 8, location: "Private Room" },
  ]);

  console.log("Creating suppliers...");
  const suppliers = await Supplier.create([
    { name: "FreshFarm Produce", contactPerson: "Ravi", phone: "9876543210" },
    { name: "Daily Dairy Co", contactPerson: "Sana", phone: "9876501234" },
    { name: "Prime Meats", contactPerson: "Arjun", phone: "9876512345" },
    { name: "SpiceRoute Traders", contactPerson: "Meera", phone: "9876523456" },
  ]);
  const [produce, dairy, meats, spice] = suppliers;

  console.log("Creating inventory...");
  const inventory = await InventoryItem.create([
    { name: "Tomatoes", unit: "kg", quantity: 25, lowStockThreshold: 10, supplier: produce._id, costPerUnit: 40 },
    { name: "Onions", unit: "kg", quantity: 30, lowStockThreshold: 10, supplier: produce._id, costPerUnit: 30 },
    { name: "Capsicum", unit: "kg", quantity: 12, lowStockThreshold: 5, supplier: produce._id, costPerUnit: 60 },
    { name: "Lemon", unit: "pieces", quantity: 80, lowStockThreshold: 20, supplier: produce._id, costPerUnit: 5 },
    { name: "Paneer", unit: "kg", quantity: 15, lowStockThreshold: 5, supplier: dairy._id, costPerUnit: 320 },
    { name: "Cheese", unit: "kg", quantity: 8, lowStockThreshold: 6, supplier: dairy._id, costPerUnit: 350 },
    { name: "Milk", unit: "litre", quantity: 40, lowStockThreshold: 15, supplier: dairy._id, costPerUnit: 60 },
    { name: "Yogurt", unit: "kg", quantity: 10, lowStockThreshold: 4, supplier: dairy._id, costPerUnit: 90 },
    { name: "Chicken", unit: "kg", quantity: 18, lowStockThreshold: 8, supplier: meats._id, costPerUnit: 220 },
    { name: "Rice", unit: "kg", quantity: 50, lowStockThreshold: 20, supplier: produce._id, costPerUnit: 55 },
    { name: "Flour", unit: "kg", quantity: 35, lowStockThreshold: 10, supplier: produce._id, costPerUnit: 45 },
    { name: "Sugar", unit: "kg", quantity: 25, lowStockThreshold: 8, supplier: produce._id, costPerUnit: 50 },
    { name: "Cooking Oil", unit: "litre", quantity: 20, lowStockThreshold: 8, supplier: produce._id, costPerUnit: 140 },
    { name: "Garam Masala", unit: "kg", quantity: 4, lowStockThreshold: 1, supplier: spice._id, costPerUnit: 600 },
    { name: "Tea Leaves", unit: "kg", quantity: 3, lowStockThreshold: 1, supplier: spice._id, costPerUnit: 400 },
  ]);

  // quick name -> id lookup so recipes read clearly
  const inv = Object.fromEntries(inventory.map((i) => [i.name, i._id]));
  const r = (name, quantity) => ({ item: inv[name], quantity });

  console.log("Creating menu (with recipes)...");
  await MenuItem.create([
    {
      name: "Margherita Pizza", category: "Main Course", price: 320,
      description: "Classic cheese & tomato",
      recipe: [r("Flour", 0.2), r("Cheese", 0.1), r("Tomatoes", 0.08)],
    },
    {
      name: "Paneer Tikka", category: "Starters", price: 280,
      description: "Grilled cottage cheese",
      recipe: [r("Paneer", 0.2), r("Yogurt", 0.05), r("Capsicum", 0.05), r("Garam Masala", 0.01), r("Cooking Oil", 0.02)],
    },
    {
      name: "Butter Chicken", category: "Main Course", price: 380,
      description: "Creamy tomato curry",
      recipe: [r("Chicken", 0.25), r("Tomatoes", 0.1), r("Milk", 0.05), r("Garam Masala", 0.01), r("Cooking Oil", 0.02)],
    },
    {
      name: "Veg Biryani", category: "Main Course", price: 260,
      description: "Fragrant spiced rice",
      recipe: [r("Rice", 0.18), r("Onions", 0.05), r("Garam Masala", 0.008), r("Cooking Oil", 0.02)],
    },
    {
      name: "Caesar Salad", category: "Starters", price: 220,
      description: "Crisp romaine & dressing",
      recipe: [r("Cheese", 0.03)],
    },
    {
      name: "Gulab Jamun", category: "Desserts", price: 120,
      description: "Warm milk dumplings",
      recipe: [r("Milk", 0.05), r("Sugar", 0.04), r("Flour", 0.03)],
    },
    {
      name: "Masala Chai", category: "Beverages", price: 60,
      description: "Spiced Indian tea",
      recipe: [r("Milk", 0.1), r("Tea Leaves", 0.005), r("Sugar", 0.01)],
    },
    {
      name: "Fresh Lime Soda", category: "Beverages", price: 90,
      description: "Sweet or salted",
      recipe: [r("Lemon", 1), r("Sugar", 0.02)],
    },
  ]);

  console.log("Creating sample reservations...");
  const admin = await User.findOne({ role: "admin" });
  await Reservation.create([
    {
      customerName: "Neha Sharma",
      phone: "9811122233",
      partySize: 4,
      table: tables[1]._id,
      date: new Date(),
      time: "19:30",
      status: "confirmed",
      createdBy: admin._id,
    },
    {
      customerName: "Rohit Verma",
      phone: "9822233344",
      partySize: 2,
      table: tables[0]._id,
      date: new Date(),
      time: "20:00",
      status: "pending",
      createdBy: admin._id,
    },
  ]);
  await Table.findByIdAndUpdate(tables[1]._id, { status: "reserved" });
  await Table.findByIdAndUpdate(tables[0]._id, { status: "reserved" });

  console.log("\nSeed complete! Login with:");
  console.log("  admin@restaurant.com    / admin123");
  console.log("  manager@restaurant.com  / manager123");
  console.log("  cashier@restaurant.com  / cashier123");
  console.log("  kitchen@restaurant.com  / kitchen123");
  console.log("  waiter@restaurant.com   / waiter123");
  console.log("\nTrack-a-booking demo numbers: 9811122233 (confirmed), 9822233344 (pending)");

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
