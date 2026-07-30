const express = require("express");
const { authenticate, allowRoles } = require("../middleware/auth");
const { listResource, listResources } = require("../controllers/explorerController");

const router = express.Router();
router.use(authenticate, allowRoles("ADMIN", "MANAGER"));
router.get("/resources", listResources);
router.get("/:resource", listResource);
module.exports = router;
