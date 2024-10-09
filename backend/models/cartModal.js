const mongoose = require("mongoose");

const CartSchema = mongoose.Schema({
    cartItems: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product"
            },
            quantity: {
                type: Number,
                required: true,
                default: 1,
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
        }
    ],
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
    },
});

module.exports = mongoose.model("Cart", CartSchema);
