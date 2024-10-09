const express = require("express");
const router = express.Router()
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const { addAddress, getAddress, updateAddress, deleteAddress } = require("../controllers/addressController");



router.route("/address")
    .put(isAuthenticatedUser, addAddress)   
    .get(isAuthenticatedUser, getAddress);

    router.route("/address/:id")
        .put(isAuthenticatedUser, updateAddress)   
        .delete(isAuthenticatedUser, deleteAddress);

module.exports = router;
