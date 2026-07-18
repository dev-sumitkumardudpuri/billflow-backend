import express from "express";
import {
  registerUser,
  loginUser,
  googleAuthHandler,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", registerUser);
router.post("/login", loginUser);
router.post("/google", googleAuthHandler);

export default router;
