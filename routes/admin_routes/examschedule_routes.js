const express = require("express");
const {
  GetStudetlist,
  addexamschedual,
  GetScheduleList,
  GetexamschedualebyId,
  deleteExamschedual,
  downloadStudentsCSV,
  getschedualbySearch,
} = require("../../controllers/admin_controller/examdetails_controller");
const verifyToken = require("../../middleware/authMiddleware");

const router = express.Router();
router.get("/getExamschedule/:center_id", verifyToken, GetStudetlist);
router.post("/addexamschedule", verifyToken, addexamschedual);
router.get("/getallExamschedule", verifyToken, GetScheduleList);
router.get("/getscheduleById/:id", verifyToken, GetexamschedualebyId);
router.delete("/deleteExamschedule/:id", verifyToken, deleteExamschedual);
router.get("/download-students/:scheduleId", verifyToken, downloadStudentsCSV);
router.get("/getschedualbySearch", verifyToken, getschedualbySearch);

module.exports = router;
