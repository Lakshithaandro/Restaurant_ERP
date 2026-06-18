import express from "express";
import {
  getInventory,
  getLowStock,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../controllers/inventoryController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getInventory);
router.get("/low-stock", getLowStock);
router.post("/", authorize("admin", "manager"), createInventoryItem);
router.put("/:id", authorize("admin", "manager"), updateInventoryItem);
router.delete("/:id", authorize("admin", "manager"), deleteInventoryItem);

router.get("/suppliers/all", getSuppliers);
router.post("/suppliers", authorize("admin", "manager"), createSupplier);
router.put("/suppliers/:id", authorize("admin", "manager"), updateSupplier);
router.delete("/suppliers/:id", authorize("admin", "manager"), deleteSupplier);

export default router;
