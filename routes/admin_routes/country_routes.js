const express = require("express");
const {
  addCountry,
  getCountry,
  updateCountry,
  deleteContry,
  getCountrybyId,
} = require("../../controllers/admin_controller/country_controller");
const verifyToken = require("../../middleware/authMiddleware");

const router = express.Router();
router.post("/addCountry",verifyToken, addCountry);
router.get("/getCountry", verifyToken, getCountry);
router.get("/getCountrybyid/:id", verifyToken, getCountrybyId);
router.put("/updateCountry/:id", verifyToken, updateCountry);
router.delete("/deleteCountry/:id", verifyToken, deleteContry);

module.exports = router;
