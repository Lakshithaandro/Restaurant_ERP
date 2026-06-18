import express from "express";
import {
  getMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getOrders,
  getKitchenQueue,
  createOrder,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

// Menu
router.get("/menu", getMenu);
router.post("/menu", authorize("admin", "manager"), createMenuItem);
router.put("/menu/:id", authorize("admin", "manager"), updateMenuItem);
router.delete("/menu/:id", authorize("admin", "manager"), deleteMenuItem);

// Orders
router.get("/", getOrders);
router.get("/kitchen", getKitchenQueue);
router.post("/", createOrder);
router.put("/:id/status", updateOrderStatus);

export default router;
