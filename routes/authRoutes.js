import express from "express";
import axios from "axios";
import FormData from "form-data";
import {
  getUserProfile,
  loginUser,
  registerUser,
  updateUserProfile,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMIddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

// --- Updated Upload Route for ImgBB ---
router.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    // ১. প্রথমেই চেক করুন req.file আছে কিনা
    if (!req.file || !req.file.buffer) {
      console.log("File not found in request!");
      return res
        .status(400)
        .json({ message: "No file uploaded or file is empty" });
    }

    const formData = new FormData();
    // buffer চেক করার পর toString কল করা
    formData.append("image", req.file.buffer.toString("base64"));

    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
      formData,
      { headers: { ...formData.getHeaders() } },
    );

    res.status(200).json({ imageUrl: response.data.data.url });
  } catch (error) {
    console.error("Upload error details:", error.message);
    res.status(500).json({ message: "Internal Server Error during upload" });
  }
});

export default router;
