const express = require("express");
const { authenticate } = require("../middleware/auth");
const controller = require("../controllers/notificationController");
const router = express.Router();
router.use(authenticate);
router.get("/", controller.list);
router.patch("/:id/read", controller.markRead);
router.post("/read-all", controller.markAllRead);
module.exports = router;
