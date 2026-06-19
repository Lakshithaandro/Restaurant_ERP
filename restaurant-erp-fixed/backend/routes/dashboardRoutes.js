import express from "express";
import {
  getDashboard,
  getReports,
} from "../controllers/dashboardController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getDashboard);
router.get("/reports", getReports);

export default router;
