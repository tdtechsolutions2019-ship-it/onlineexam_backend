const express = require("express");
const {
  StoreQuestions,
  SaveAnswer,
} = require("../../controllers/question_storeinmongo/questionStore_Controller");

const router = express.Router();
router.post("/AddQuestions", StoreQuestions);
router.post("/SaveAnswer", SaveAnswer);

module.exports = router;
