const express = require("express");
const router = express.Router()
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const { addCart, getCartItems, deleteCartItem, updateCartItem } = require("../controllers/cartController");


router.route("/cart").put(isAuthenticatedUser, addCart);

router.route("/cart-items").get(isAuthenticatedUser, getCartItems);

router
    .route("/cart-item/:id")
    .delete(isAuthenticatedUser, deleteCartItem)
    .put(isAuthenticatedUser, updateCartItem);

module.exports = router;
