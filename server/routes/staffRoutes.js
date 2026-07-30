const express = require("express");
const { authenticate, allowRoles } = require("../middleware/auth");
const controller = require("../controllers/staffController");

const router = express.Router();
router.use(authenticate, allowRoles("ADMIN", "MANAGER"));
router.get("/users", controller.listUsers);
router.get("/users/eligible-employees", controller.listEligibleEmployees);
router.get("/users/:id", controller.getUserDetails);
router.post("/users", controller.createStaffUser);
router.patch("/users/:id/status", controller.setUserStatus);
router.post("/users/:id/reset-password", controller.resetPassword);
router.post("/users/:id/unlock", controller.unlockUser);
router.patch("/users/:id/role", controller.changeRole);

module.exports = router;
