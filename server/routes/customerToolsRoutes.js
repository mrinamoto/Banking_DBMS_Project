const express = require("express");
const { authenticate, allowRoles } = require("../middleware/auth");
const controller = require("../controllers/customerToolsController");

const router = express.Router();
router.use(authenticate);

router.get("/statements", controller.statement);
router.post("/transactions/:id/reversal", allowRoles("ADMIN", "MANAGER"), controller.reverseTransaction);

router.get("/settings", controller.getSettings);
router.patch("/settings/profile", controller.updateProfile);
router.post("/settings/password", controller.changePassword);
router.patch("/settings/preferences", controller.updatePreferences);

router.get("/beneficiaries", allowRoles("ADMIN", "MANAGER", "CUSTOMER"), controller.listBeneficiaries);
router.post("/beneficiaries", allowRoles("CUSTOMER"), controller.createBeneficiary);
router.patch("/beneficiaries/:id", allowRoles("CUSTOMER"), controller.updateBeneficiary);

router.get("/kyc", allowRoles("ADMIN", "MANAGER", "CUSTOMER"), controller.listKyc);
router.post("/kyc", allowRoles("CUSTOMER"), controller.submitKyc);
router.patch("/kyc/:id", allowRoles("CUSTOMER"), controller.updateKyc);
router.post("/kyc/:id/review", allowRoles("ADMIN", "MANAGER"), controller.reviewKyc);

module.exports = router;
