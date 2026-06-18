import InventoryItem from "../models/InventoryItem.js";
import Supplier from "../models/Supplier.js";
import MenuItem from "../models/MenuItem.js";

// ---- Inventory ----
export const getInventory = async (req, res) => {
  const items = await InventoryItem.find()
    .populate("supplier", "name")
    .sort("name");
  res.json(items);
};

export const getLowStock = async (req, res) => {
  const items = await InventoryItem.find().populate("supplier", "name");
  const low = items.filter((i) => i.quantity <= i.lowStockThreshold);
  res.json(low);
};

export const createInventoryItem = async (req, res) => {
  const item = await InventoryItem.create(req.body);
  const populated = await item.populate("supplier", "name");
  res.status(201).json(populated);
};

export const updateInventoryItem = async (req, res) => {
  const item = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate("supplier", "name");
  if (!item) return res.status(404).json({ message: "Item not found" });
  res.json(item);
};

export const deleteInventoryItem = async (req, res) => {
  const usedBy = await MenuItem.find({ "recipe.item": req.params.id }).select("name");
  if (usedBy.length) {
    const names = usedBy.map((m) => m.name).join(", ");
    return res.status(400).json({
      message: `Cannot delete: used in recipe for ${names}. Remove it from those dishes first.`,
    });
  }
  const item = await InventoryItem.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Item not found" });
  res.json({ message: "Item deleted" });
};

// ---- Suppliers ----
export const getSuppliers = async (req, res) => {
  const suppliers = await Supplier.find().sort("name");
  res.json(suppliers);
};

export const createSupplier = async (req, res) => {
  if (!req.body.name || !String(req.body.name).trim()) {
    return res.status(400).json({ message: "Supplier name is required." });
  }
  const supplier = await Supplier.create(req.body);
  res.status(201).json(supplier);
};

export const updateSupplier = async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!supplier) return res.status(404).json({ message: "Supplier not found" });
  res.json(supplier);
};

export const deleteSupplier = async (req, res) => {
  const inUse = await InventoryItem.countDocuments({ supplier: req.params.id });
  if (inUse > 0) {
    return res.status(400).json({
      message: `Cannot delete: ${inUse} inventory item(s) still use this supplier.`,
    });
  }
  const supplier = await Supplier.findByIdAndDelete(req.params.id);
  if (!supplier) return res.status(404).json({ message: "Supplier not found" });
  res.json({ message: "Supplier removed" });
};
