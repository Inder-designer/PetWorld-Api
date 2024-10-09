const mongoose = require("mongoose");
const { AddressSchema } = require("../models/addressModel");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  orders: [
    {
      shippingInfo: AddressSchema,
      orderItems: [
        {
          name: {
            type: String,
            required: true,
          },
          price: {
            type: Number,
            required: true,
          },
          discountPrice: {
            type: Number,
            required: true,
            default: 0,
          },
          quantity: {
            type: Number,
            required: true,
          },
          image: {
            type: String,
            default: null,
          },
          productId: {
            type: mongoose.Schema.ObjectId,
            ref: "Product",
            required: true,
          },
        },
      ],
      paymentMethod: {
        type: String,
        required: true,
        enum: ['cash', 'upi', 'card', 'netbanking'], // Enum for payment methods
      },
      paymentInfo: {
        id: {
          type: String,
          required: function () {
            return this.paymentMethod !== 'cash';
          },
        },
        status: {
          type: String,
          required: function () {
            return this.paymentMethod !== 'cash';
          },
        },
        paidAt: {
          type: String,
          required: function () {
            return this.paymentMethod !== 'cash';
          },
        },
      },
      isPaid: { type: Boolean, required: true, default: false },
      orderId: {
        type: String,
        required: true
      },
      subTotal: {
        type: Number,
        required: true,
        default: 0,
      },
      taxPrice: {
        type: Number,
        required: true,
        default: 0,
      },
      shippingPrice: {
        type: Number,
        required: true,
        default: 0,
      },
      totalPrice: {
        type: Number,
        required: true,
        default: 0,
      },
      totalDiscount: {
        type: Number,
        required: true,
        default: 0,
      },
      orderStatus: {
        type: String,
        required: true,
        default: "Processing",
      },
      isDelivered: { type: Boolean, required: true, default: false },
      deliveredAt: { type: Date },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }
  ],
});

module.exports = mongoose.model("Order", orderSchema);
