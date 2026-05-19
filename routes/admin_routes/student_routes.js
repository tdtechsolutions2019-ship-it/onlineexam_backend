const express = require("express");
const {
  addStudent,
  getStudent,
  deleteStudent,
  updateStudent,
  getStudentById,
  getStudentbySearch,
} = require("../../controllers/admin_controller/student_controller");
const { upload } = require("../../middleware/upload");
const router = express.Router();
const verifyToken = require("../../middleware/authMiddleware");

router.post(
  "/addstudent",
  verifyToken,
  upload.fields([{ name: "profile_photo", maxCount: 1 }]),
  addStudent,
);
router.get("/getstudent", getStudent);
router.get("/getstudentBysearch", verifyToken, getStudentbySearch);
router.delete("/deleteStudent/:id", verifyToken, deleteStudent);
router.put(
  "/updatestudent/:id",
  verifyToken,
  upload.fields([{ name: "profile_photo", maxCount: 1 }]),
  updateStudent,
);
router.get("/getStudentById/:id", verifyToken, getStudentById);
module.exports = router;
