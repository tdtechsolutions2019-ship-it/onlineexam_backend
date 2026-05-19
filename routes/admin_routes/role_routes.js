const express = require("express");
const {
  addRole,
  GetAllRoles,
  GetRolesById,
  updateRole,
  deleteRole,
} = require("../../controllers/admin_controller/role_controller");
const verifyToken = require("../../middleware/authMiddleware");
const router = express.Router();
router.post("/addRole", verifyToken, addRole);
router.get("/getRole", verifyToken, GetAllRoles);
router.get("/getRolebyId/:id", verifyToken, GetRolesById);
router.put("/updateRole/:id", verifyToken, updateRole);
router.delete("/deleteRole/:id", verifyToken, deleteRole);

module.exports = router;
