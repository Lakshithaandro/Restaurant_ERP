import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
import Table from "../models/Table.js";
import { deductInventoryForOrder } from "../utils/inventory.js";

// Keep only valid recipe lines: a real ingredient id and a positive quantity.
const cleanRecipe = (recipe) =>
  (Array.isArray(recipe) ? recipe : [])
    .filter((r) => r && r.item && Number(r.quantity) > 0)
    .map((r) => ({ item: r.item, quantity: Number(r.quantity) }));

// ---- Menu ----
export const getMenu = async (req, res) => {
  const items = await MenuItem.find()
    .populate("recipe.item", "name unit")
    .sort("category name");
  res.json(items);
};

export const createMenuItem = async (req, res) => {
  const data = { ...req.body, recipe: cleanRecipe(req.body.recipe) };
  const item = await MenuItem.create(data);
  const populated = await item.populate("recipe.item", "name unit");
  res.status(201).json(populated);
};

export const updateMenuItem = async (req, res) => {
  const update = { ...req.body };
  // Only touch the recipe if the caller actually sent one (so a simple
  // "hide/show" toggle doesn't wipe the ingredients).
  if (req.body.recipe !== undefined) update.recipe = cleanRecipe(req.body.recipe);

  const item = await MenuItem.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  }).populate("recipe.item", "name unit");
  if (!item) return res.status(404).json({ message: "Menu item not found" });
  res.json(item);
};

export const deleteMenuItem = async (req, res) => {
  const item = await MenuItem.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Menu item not found" });
  res.json({ message: "Menu item deleted" });
};

// ---- Orders ----
const genOrderNumber = () =>
  "ORD-" + Date.now().toString().slice(-6) + Math.floor(Math.random() * 90 + 10);

export const getOrders = async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const orders = await Order.find(filter)
    .populate("placedBy", "name")
    .sort("-createdAt");
  res.json(orders);
};

// Active orders for the kitchen queue (not served/cancelled)
export const getKitchenQueue = async (req, res) => {
  const orders = await Order.find({
    status: { $in: ["pending", "preparing", "ready"] },
  }).sort("createdAt");
  res.json(orders);
};

const badOrderRequest = (message) => {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
};

export const createOrderFromItems = async ({ tableId, items, placedBy }) => {
  if (!items || items.length === 0) {
    throw badOrderRequest("Order needs at least one item");
  }

  // Build order items from the live menu so prices cannot be tampered with.
  // Also reject invalid quantities here, because API clients can bypass the UI.
  const orderItems = [];
  let total = 0;
  for (const i of items) {
    const qty = Number(i.quantity || 1);
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
      throw badOrderRequest("Each order item quantity must be a whole number from 1 to 99.");
    }

    const menuItem = await MenuItem.findById(i.menuItem);
    if (!menuItem) continue;
    if (!menuItem.available) {
      throw badOrderRequest(`${menuItem.name} is currently unavailable.`);
    }

    orderItems.push({
      menuItem: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: qty,
    });
    total += menuItem.price * qty;
  }

  if (orderItems.length === 0) {
    throw badOrderRequest("No valid menu items in this order.");
  }

  let tableNumber;
  if (tableId) {
    const table = await Table.findById(tableId);
    if (table) {
      tableNumber = table.number;
      table.status = "occupied";
      await table.save();
    }
  }

  return Order.create({
    orderNumber: genOrderNumber(),
    table: tableId,
    tableNumber,
    items: orderItems,
    total,
    ...(placedBy ? { placedBy } : {}),
  });
};

export const createOrder = async (req, res) => {
  try {
    const order = await createOrderFromItems({
      tableId: req.body.tableId,
      items: req.body.items,
      placedBy: req.user._id,
    });

    // notify kitchen screens in real time
    req.app.get("io").emit("order:new", order);
    res.status(201).json(order);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message || "Could not place order." });
  }
};

const ORDER_STATUSES = ["pending", "preparing", "ready", "served", "cancelled"];

export const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ message: "Invalid order status." });
  }
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });

  order.status = status;
  await order.save();

  // When the dish is served, pull its ingredients from inventory (once).
  if (status === "served") {
    const deducted = await deductInventoryForOrder(order);
    if (deducted.length) req.app.get("io").emit("inventory:update", deducted);
  }

  // broadcast the status change to all clients (kitchen + waiter screens)
  req.app.get("io").emit("order:update", order);
  res.json(order);
};
