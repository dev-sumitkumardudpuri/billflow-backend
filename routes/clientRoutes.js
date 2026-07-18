import express from "express";
import {
  addClient,
  getMyClients,
  deleteClient,
} from "../controllers/clientController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.route("/").post(protect, addClient).get(protect, getMyClients);

router.route("/:id").delete(protect, deleteClient);

export default router;
