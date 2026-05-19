const express = require("express");
const {
  getQuestion,
  saveAttampt,
  getAllExam,
  GetQuestions,
  ResumeExam,
} = require("../../controllers/front_controllers/question_controller/exam_controller");

const router = express.Router();
router.get("/getQuestion", getQuestion);
router.post("/saveanswer", saveAttampt);
router.get("/getAllExam", getAllExam);
router.get("/getAllQuestion/:studentId/:language_id", GetQuestions);
router.get("/resumeExam/:session_id", ResumeExam);

module.exports = router;
