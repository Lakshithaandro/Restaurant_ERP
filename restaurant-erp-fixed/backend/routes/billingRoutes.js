import express from "express";
import {
  getInvoices,
  getBillableOrders,
  createInvoice,
  downloadInvoice,
} from "../controllers/billingController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getInvoices);
router.get("/billable", getBillableOrders);
router.get("/:id/download", authorize("admin", "manager", "cashier", "waiter"), downloadInvoice);
router.post("/", authorize("admin", "manager", "cashier", "waiter"), createInvoice);

export default router;
