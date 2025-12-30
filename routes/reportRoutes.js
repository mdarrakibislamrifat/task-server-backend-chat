import express from "express";
import { adminOnly, protect } from "../middlewares/authMiddleware.js";
import {
  exportTasksReport,
  exportUsersReport,
} from "../controllers/reportController.js";

const router = express.Router();

router.get("/export/tasks", protect, adminOnly, exportTasksReport);
router.get("/export/users", protect, exportUsersReport);

export default router;
