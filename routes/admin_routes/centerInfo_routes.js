const express = require("express");

const {
  addCenterInfo,
  getCentreInfo,
  getCenterInfoBYId,
  updateCenterInfo,
  deleteCenter,
} = require("../../controllers/admin_controller/centerinfo_controller");
const { upload } = require("../../middleware/upload");
const verifyToken = require("../../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/addcenterInfo",
  verifyToken,
  upload.fields([{ name: "center_logo", maxCount: 1 }]),
  addCenterInfo,
);
router.get("/getcenterInfo",verifyToken, getCentreInfo);
router.get("/getcenterInfoById/:id", verifyToken, getCenterInfoBYId);
router.put(
  "/updatecenterInfo/:id",
  verifyToken,
  upload.fields([{ name: "center_logo", maxCount: 1 }]),
  updateCenterInfo,
);
router.delete("/deletecenterInfo/:id", verifyToken, deleteCenter);

module.exports = router;
