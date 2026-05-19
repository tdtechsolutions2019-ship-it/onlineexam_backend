const express = require("express");
const {
  uploadFile,
  uploadQuestionFile,
  getImportHistoryforque,
  getImportHistorydetailsforque,
} = require("../../importfiles/importfile");
const { uploadStudentFile } = require("../../importfiles/importStudent");
const multer = require("multer");
const verifyToken = require("../../middleware/authMiddleware");
const router = express.Router();
const storage = multer.memoryStorage(); // IMPORTANT for buffer
const upload = multer({ storage });
router.post(
  "/state/importState",
  verifyToken,
  upload.single("file"),
  uploadFile,
);
router.post("/student/importStudent", upload.single("file"), uploadStudentFile);
router.post("/Question/BulkImport", upload.single("file"), uploadQuestionFile);
router.get("/Question/getImportHistory", getImportHistoryforque);
router.get(
  "/Question/getImportHistorydetailsforque/:id",
  getImportHistorydetailsforque,
);

module.exports = router;
