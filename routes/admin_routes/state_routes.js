const express = require("express");
const {
  addState,
  getState,
  updateState,
  deleteState,
  getStatebyId,
} = require("../../controllers/admin_controller/state_controller");
const verifyToken = require("../../middleware/authMiddleware");

const router = express.Router();
router.post("/addState", verifyToken, addState);
router.get("/getstate",verifyToken, getState);
router.get("/getstatebyId/:id",verifyToken, getStatebyId);
router.put("/updateState/:id",verifyToken, updateState);
router.delete("/deleteState/:id",verifyToken, deleteState);

module.exports = router;
