const express = require("express");

const verifyToken = require("../../middleware/authMiddleware");
const {
  addUser,
  getUser,
  getUserById,
  updateUser,
  deleteUser,
  addUserPhoto,
  getUserPhoto
} = require("../../controllers/admin_controller/user_controller");
const { upload } = require("../../middleware/upload");
const router = express.Router();
router.post("/addUser", verifyToken, addUser);
router.get("/getUser", verifyToken, getUser);
router.get("/getUserById/:id", verifyToken, getUserById);
router.put("/updateUser/:id", verifyToken, updateUser);
router.delete("/deleteUser/:id",verifyToken, deleteUser);
router.put(
  "/addUserPhoto/:id",
  verifyToken,
  upload.fields([{ name: "user_img", maxCount: 1 }]),
  addUserPhoto,
);
router.get("/getUserPhoto/:id", verifyToken, getUserPhoto);
module.exports = router;
