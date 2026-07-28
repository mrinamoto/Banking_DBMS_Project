const express = require("express");
const { login, register, me, logout } = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const router = express.Router();
router.post("/login", login);
router.post("/register", register);
router.get("/me", authenticate, me);
router.post("/logout", authenticate, logout);
module.exports = router;
