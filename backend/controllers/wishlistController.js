const Wishlist = require("../models/wishlistModel");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorhander");

// Add Wishlist 
exports.addWishlist = catchAsyncErrors(async (req, res, next) => {
    console.log("Received request to add product to wishlist");
    const { productId } = req.body;
    req.body.user = req.user.id;

    const existProduct = await Product.findById(productId);
    if (!existProduct) {
        return next(new ErrorHandler("Product not found", 404));
    }

    let wishlist = await Wishlist.findOne({ user: req.user.id });

    if (wishlist) {
        const productExists = wishlist.wishlistItems.some(
            (item) => item.product.toString() === productId
        );

        if (productExists) {
            return next(new ErrorHandler("Product already in wishlist", 400));
        }

        wishlist.wishlistItems.push({ product: productId });
    } else {
        wishlist = new Wishlist({
            user: req.user.id,
            wishlistItems: [{ product: productId }],
        });
    }

    await wishlist.save();

    res.status(201).json({
        success: true,
        wishlist
    });
});

// Get Wishlist
exports.getWishlist = catchAsyncErrors(async (req, res, next) => {
    const wishlist = await Wishlist.findOne({ user: req.user.id }).populate("wishlistItems.product");
    res.status(200).json({
        success: true,
        wishlist
    });
});

// Remove Wishlist
exports.removeWishlist = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    console.log(id);
    const wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
        return next(new ErrorHandler("Wishlist not found", 404));
    }

    const index = wishlist.wishlistItems.findIndex((item) => item.product.toString() === id);

    if (index === -1) {
        return next(new ErrorHandler("Product not found in wishlist", 404));
    }

    wishlist.wishlistItems.splice(index, 1);
    await wishlist.save();

    res.status(200).json({
        success: true,
        message: "Product removed from wishlist"
    });
});