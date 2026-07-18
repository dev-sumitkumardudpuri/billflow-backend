import express from "express";
import {
  createAndSendInvoice,
  markAsPaid,
  getDashboardStats,
} from "../controllers/invoiceController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/generate", protect, createAndSendInvoice);

router.get("/dashboard/stats", protect, getDashboardStats);

router.patch("/:id/pay", protect, markAsPaid);

export default router;
