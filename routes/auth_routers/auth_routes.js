const express = require("express");
const {
  login,
  register,
  Studentlogin,
} = require("../../controllers/auth_controller/auth_controller");

const router = express.Router();
router.post("/register", register);
router.post("/login", login);
router.post("/studentLogin", Studentlogin);

module.exports = router;
