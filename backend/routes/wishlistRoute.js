const express = require("express");
const router = express.Router()
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const { addWishlist, getWishlist, removeWishlist } = require("../controllers/wishlistController");


router.route("/wishlist")
.put(isAuthenticatedUser, addWishlist)
.get(isAuthenticatedUser, getWishlist);

router.route("/wishlist-item/:id").delete(isAuthenticatedUser, removeWishlist);

module.exports = router;