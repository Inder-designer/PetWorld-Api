const mongoose = require("mongoose");

const wishlistSchema = mongoose.Schema({
    wishlistItems: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product"
            },
        }
    ],
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
    },
});

module.exports = mongoose.model("Wishlist", wishlistSchema);
