const express = require("express");
const router = express.Router()
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const { createAttribute, editAttribute, getAllAttributes, getSingleAttribute } = require("../controllers/attributeController");

router.route("/admin/attribute/new").post(isAuthenticatedUser, authorizeRoles("admin"), createAttribute);
router.route("/admin/attribute/:id")
    .put(isAuthenticatedUser, authorizeRoles("admin"), editAttribute)
    .get(isAuthenticatedUser, authorizeRoles("admin"), getSingleAttribute);
router.route("/attributes").get(getAllAttributes);

module.exports = router;
