const express = require("express");
const {
  addSubject,
  getSubject,
  getSubjectByid,
  updateSubject,
  deleteSubject,
} = require("../../controllers/admin_controller/subject_controller");
const verifyToken = require("../../middleware/authMiddleware");

const router = express.Router();
router.post("/addSubject", verifyToken, addSubject);
router.get("/getSubject", verifyToken, getSubject);
router.get("/getSubjectByid/:id", verifyToken, getSubjectByid);
router.put("/updateSubject/:id", verifyToken, updateSubject);
router.delete("/deleteSubject/:id", verifyToken, deleteSubject);

module.exports = router;
