const express = require("express");

const {
  addRetest,
  getRetest,
  UpdateRetest,
} = require("../../controllers/admin_controller/retest_controler");
const verifyToken = require("../../middleware/authMiddleware");

const router = express.Router();
router.post("/addRetest", verifyToken, addRetest);
router.get("/getRetest", verifyToken, getRetest);
router.put("/updateRetest", verifyToken, UpdateRetest);

module.exports = router;
