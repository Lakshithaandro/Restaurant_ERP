import express from "express";
import {
  getTables,
  createTable,
  updateTable,
  getReservations,
  createReservation,
  updateReservation,
  deleteReservation,
} from "../controllers/reservationController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

// Tables
router.get("/tables", getTables);
router.post("/tables", authorize("admin", "manager"), createTable);
router.put("/tables/:id", authorize("admin", "manager"), updateTable);

// Reservations
router.get("/", getReservations);
router.post("/", createReservation);
router.put("/:id", updateReservation);
router.delete("/:id", authorize("admin", "manager"), deleteReservation);

export default router;
