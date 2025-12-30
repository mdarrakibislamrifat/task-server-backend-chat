import express from "express";
import { adminOnly, protect } from "../middlewares/authMiddleware.js";
import {
  getUserById,
  getUsers,
  getAllUsers,
} from "../controllers/userController.js";

const router = express.Router();

// User Management Routes
router.get("/", protect, adminOnly, getUsers);
router.get("/all", protect, getAllUsers);
router.get("/:id", protect, getUserById);

export default router;
