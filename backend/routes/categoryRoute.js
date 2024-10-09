const express = require("express");
const router = express.Router()
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const { createCategory, getCategories, editCategory } = require("../controllers/categoryController");

router.route("/admin/category/new").put(isAuthenticatedUser, authorizeRoles("admin"), createCategory);
router.route("/admin/categories").get(isAuthenticatedUser, authorizeRoles("admin"), getCategories);
router.route("/admin/category").put(isAuthenticatedUser, authorizeRoles("admin"), editCategory);

module.exports = router;
