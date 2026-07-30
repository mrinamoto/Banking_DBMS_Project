const express = require("express");
const { authenticate, allowRoles } = require("../middleware/auth");
const controller = require("../controllers/depositController");

const router = express.Router();
router.use(authenticate);
const staffAndCustomers = allowRoles("ADMIN", "MANAGER", "EMPLOYEE", "CUSTOMER");

router.get("/deposit-schemes", staffAndCustomers, controller.listSchemes);
router.post("/deposit-schemes", allowRoles("ADMIN"), controller.createScheme);
router.patch("/deposit-schemes/:id", allowRoles("ADMIN"), controller.updateScheme);
router.post("/deposit-calculator", staffAndCustomers, controller.calculate);
router.post("/deposit-quotes", allowRoles("CUSTOMER"), controller.createQuote);
router.get("/deposit-quotes", staffAndCustomers, controller.listQuotes);
router.get("/deposit-reminders", staffAndCustomers, controller.reminders);
router.post("/deposit-quotes/:id/early-withdrawal-preview", staffAndCustomers, controller.earlyPreview);

module.exports = router;
