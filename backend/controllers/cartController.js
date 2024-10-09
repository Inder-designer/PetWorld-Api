const Cart = require("../models/cartModal");
const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorhander");

// Add Cart
exports.addCart = catchAsyncErrors(async (req, res, next) => {
    const { quantity, product } = req.body;
    req.body.user = req.user.id;

    // Find the product by productId
    const existProduct = await Product.findById(product);
    if (!existProduct) {
        return next(new ErrorHander("Product not found", 404));
    }

    // Find the user's cart
    let cart = await Cart.findOne({ user: req.user.id });

    const maxAllowedQuantity = Math.min(existProduct.Stock, existProduct.orderLimit);
    let message;

    // If the cart does not exist, create a new one
    if (!cart) {
        if (quantity > maxAllowedQuantity) {
            return next(new ErrorHander(`We're sorry! Only ${maxAllowedQuantity} unit(s) allowed in each order`, 400));
        }
        cart = new Cart({
            user: req.user.id,
            cartItems: [{ product, quantity }]
        });
        message = `${existProduct.name} added to cart`;
    } else {
        // Check if the product is already in the cart
        const cartItem = cart.cartItems.find(item => item.product.toString() === product.toString());

        if (cartItem) {
            // If the product is in the cart, check the new total quantity
            const newQuantity = cartItem.quantity + quantity;

            // Check if the new quantity exceeds the max allowed quantity
            if (newQuantity > maxAllowedQuantity) {
                return next(new ErrorHander(`We're sorry! Only ${maxAllowedQuantity} unit(s) allowed in each order`, 400));
            }

            // If the new quantity is within the limit, update the quantity
            cartItem.quantity = newQuantity;
            message = `You have this item in your bag and we have increased the quantity by ${quantity}`;
        } else {
            // If the product is not in the cart, check if the requested quantity exceeds the limit
            if (quantity > maxAllowedQuantity) {
                return next(new ErrorHander(`We're sorry! Only ${maxAllowedQuantity} unit(s) allowed in each order`, 400));
            }
            cart.cartItems.push({ product, quantity });
            message = `${existProduct.name} added to cart`;
        }
    }

    // Save the cart
    await cart.save();

    res.status(201).json({
        success: true,
        message,
        cart
    });
});



// Get Cart-Items
exports.getCartItems = catchAsyncErrors(async (req, res, next) => {

    // console.log(req.body,"getCartItems");S
    req.body.user = req.user.id;
    const cart = await Cart.findOne({ user: req.user.id });
    res.status(200).json({
        success: true,
        cart
    });
});

// Delete Cart Item
exports.deleteCartItem = catchAsyncErrors(async (req, res, next) => {
    console.log(req.params.id.toString());
    const cart = await Cart.findOne({ user: req.user.id });

    const cartItem = cart.cartItems.find(item => item._id.toString() === req.params.id.toString());
    console.log("cartItem:", cartItem);

    if (!cartItem) {
        return next(new ErrorHandler("Item not found in cart", 404));
    }
    const index = cart.cartItems.indexOf(cartItem);
    cart.cartItems.splice(index, 1);
    await cart.save();
    res.status(200).json({
        success: true,
        cart,
        message:"Successfully removed from your cart"
    });
});

// Update Quantity
exports.updateCartItem = catchAsyncErrors(async (req, res, next) => {
    console.log(req.params.id.toString());
    console.log(req.body.quantity);
    const cart = await Cart.findOne({ user: req.user.id });
    const cartItem = cart.cartItems.find(item => item.product.toString() === req.params.id.toString());
    console.log("cartItem:", cartItem);
    if (!cartItem) {
        return next(new ErrorHandler("Product not found in cart", 404));
    }
    cartItem.quantity = req.body.quantity;
    await cart.save();
    res.status(200).json({
        success: true,
        cart
    });
});