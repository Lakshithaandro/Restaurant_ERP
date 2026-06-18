import express from "express";
import {
  getStaff,
  updateStaff,
  deleteStaff,
  getAttendance,
  markAttendance,
  getMyAttendance,
  markSelfAttendance,
} from "../controllers/staffController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", authorize("admin", "manager"), getStaff);
router.put("/:id", authorize("admin"), updateStaff);
router.delete("/:id", authorize("admin"), deleteStaff);

// Any authenticated staff member can view and mark their own attendance
router.get("/attendance/me", getMyAttendance);
router.post("/attendance/self", markSelfAttendance);

// Admin-only: view all attendance and mark attendance for anyone
router.get("/attendance/all", authorize("admin"), getAttendance);
router.post("/attendance", authorize("admin"), markAttendance);

export default router;
