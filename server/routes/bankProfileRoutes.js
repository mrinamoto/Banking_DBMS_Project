const express = require("express");
const { authenticate, allowRoles } = require("../middleware/auth");
const controller = require("../controllers/bankProfileController");

const router = express.Router();
router.get("/", controller.getProfile);
router.patch("/", authenticate, allowRoles("ADMIN"), controller.updateProfile);

module.exports = router;
