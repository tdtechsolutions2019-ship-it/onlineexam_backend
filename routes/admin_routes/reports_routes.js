const express = require("express");
const verifyToken = require("../../middleware/authMiddleware");
const {
  getExamReports,
  getAppearReports,
  releaseStudent,
  reschedualStudent,
  resultReport,
  downloadController,
  ViewResultReport,
  saveResultReport,
} = require("../../controllers/admin_controller/reports_controller");
const router = express.Router();

router.get("/examreports", verifyToken, getExamReports);
router.get("/appearReports", verifyToken, getAppearReports);
router.post("/releaseStudent", verifyToken, releaseStudent);
router.get("/reschedualStudent/:center_id", verifyToken, reschedualStudent);
router.get("/resultReport", verifyToken, resultReport);
router.post("/downloadQuestion", verifyToken, downloadController);
router.get("/ViewResultReport/:ExamLoginid", verifyToken, ViewResultReport);
router.post("/saveResultReport", verifyToken, saveResultReport);
module.exports = router;
