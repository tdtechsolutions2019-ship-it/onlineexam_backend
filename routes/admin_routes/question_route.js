const express = require("express");
const {
  addQuestion,
  getQuestion,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  getQuestionCSV,
} = require("../../controllers/admin_controller/question_controller");
const verifyToken = require("../../middleware/authMiddleware");
const router = express.Router();
router.post("/addquestion", verifyToken, addQuestion);
router.get("/getquestion", verifyToken, getQuestion);
router.get("/getquestionbyid/:id", verifyToken, getQuestionById);
router.put("/updatequestion/:id", verifyToken, updateQuestion);
router.delete("/deletequestion/:id", verifyToken, deleteQuestion);
router.get("/getquestioncsv", verifyToken, getQuestionCSV);
module.exports = router;
