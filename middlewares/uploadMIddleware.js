import multer from "multer";

// ১. diskStorage-এর পরিবর্তে memoryStorage ব্যবহার করুন
// এটি করলে ফাইলটি RAM-এ থাকবে এবং req.file.buffer পাওয়া যাবে
const storage = multer.memoryStorage();

// File filter (এটি আগের মতোই থাকবে)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only JPEG, JPG, and PNG are allowed."),
      false,
    );
  }
};

const upload = multer({
  storage, // Memory storage এখন এক্টিভ
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // ৫ মেগাবাইট লিমিট
  },
});

export default upload;
