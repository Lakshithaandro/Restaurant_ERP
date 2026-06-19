import express from "express";
import {
  createPublicReservation,
  getPublicMenu,
  getPublicTables,
  lookupReservations,
} from "../controllers/publicController.js";

const router = express.Router();

router.get("/tables", getPublicTables);
router.get("/menu", getPublicMenu);
router.get("/reservations/lookup", lookupReservations);
router.post("/reservations", createPublicReservation);

export default router;
