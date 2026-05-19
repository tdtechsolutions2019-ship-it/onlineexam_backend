const express = require("express");
const {
  addCourse,
  getCourse,
  deleteCourse,
  updateCourse,
  getCourseByid,
} = require("../../controllers/admin_controller/course_controller");
const verifyToken = require("../../middleware/authMiddleware");

const router = express.Router();
router.post("/addCourse", verifyToken,addCourse);
router.get("/getCourse",getCourse);
router.delete("/deleteCourse/:id",verifyToken, deleteCourse);
router.put("/updateCourse/:id", verifyToken,updateCourse);
router.get("/getCourseByid/:id",verifyToken, getCourseByid);

module.exports = router;
