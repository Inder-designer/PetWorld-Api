const Order = require("../models/orderModel");
const { v4: uuidv4 } = require('uuid');
const Product = require("../models/productModel");
const ErrorHander = require("../utils/errorhander");
const Cart = require("../models/cartModal");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

// Function to generate a custom orderId
const generateOrderId = (userId) => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // Format the date as YYYYMMDD
  const randomPart = Math.floor(1000000000 + Math.random() * 9000000000).toString(); // Generate a random 10-digit number
  const userPart = userId.toString().replace(/\D/g, '').slice(-4);
  const combined = `${randomPart}${datePart}${userPart}`;
  return shuffleString(combined);
};
const shuffleString = (str) => {
  const arr = str.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
};

// Create new Order
exports.newOrder = catchAsyncErrors(async (req, res, next) => {
  const {
    shippingInfo,
    orderItems,
    totalPrice,
    totalDiscount,
    shippingPrice,
    taxPrice,
    subTotal,
    paymentMethod,
    paymentInfo,
  } = req.body;

  const orderId = generateOrderId(req.user._id);
  // Build the order object
  const newOrder = {
    shippingInfo,
    orderItems,
    paymentMethod,
    subTotal,
    taxPrice,
    shippingPrice,
    totalPrice,
    orderId,
    totalDiscount,
    isPaid: false,
    orderStatus: "Processing", // Initial order status
    isDelivered: false, // Initially set isDelivered to false
    deliveredAt: null, // Initially set deliveredAt to null
  };

  // Conditionally add paymentInfo if paymentMethod is not 'cash'
  if (paymentMethod !== 'cash') {
    newOrder.paymentInfo = paymentInfo;
  }

  if (paymentInfo && paymentInfo.status === "succeeded") {
    newOrder.isPaid = true;
  }

  let order = await Order.findOne({ user: req.user._id });
  let cart = await Cart.findOne({ user: req.user._id })

  if (!order) {
    // If no existing order, create a new one
    order = await Order.create({
      user: req.user._id,
      orders: [newOrder], // Wrap the new order in an array
    });


  } else {
    // If user already has orders, push the new order into the existing array
    order.orders.push(newOrder);
    await order.save(); // Save the updated order document
  }
  
  // If there is an existing order, update product stock
  if (order) {
    for (let item of orderItems) {
      await Product.findOneAndUpdate(
        { _id: item.productId },
        { $inc: { Stock: -item.quantity } },
        { new: true }
      );
    }
  }
  
  if (cart) {
    cart.cartItems = [];
    await cart.save(); // Save the updated cart document
  }

  // which product has in new Order decrease stock == newOrder product quantity

  res.status(201).json({
    success: true,
    order,
    newOrderId: orderId
  });
});


// get Single Order
exports.getSingleOrder = catchAsyncErrors(async (req, res, next) => {
  console.log(req.params.id);

  // Fetch all orders
  const orders = await Order.find();

  let foundOrder = null;

  // Iterate over the orders to find the specific order by orderId
  for (let i = 0; i < orders.length; i++) {
    const nestedOrder = orders[i].orders.find((order) => order.orderId === req.params.id);
    if (nestedOrder) {
      foundOrder = nestedOrder;
      break;
    }
  }
  console.log(foundOrder);
  if (!foundOrder) {
    return next(new ErrorHander("Order not found", 404));
  }

  res.status(200).json({
    success: true,
    order: foundOrder,
  });
});

// get logged in user  Orders
exports.myOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id });

  res.status(200).json({
    success: true,
    orders,
  });
});

// get all Orders -- Admin
exports.getAllOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find();

  let totalAmount = 0;

  orders.forEach((order) => {
    order.orders.forEach((orders) => {
      totalAmount += orders.totalPrice
      // console.log(totalAmount);
    })
  });

  res.status(200).json({
    success: true,
    totalAmount,
    orders,
  });
});

// update Order Status -- Admin
exports.updateOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHander("Order not found with this Id", 404));
  }

  if (order.orderStatus === "Delivered") {
    return next(new ErrorHander("You have already delivered this order", 400));
  }

  if (req.body.status === "Shipped") {
    order.orderItems.forEach(async (o) => {
      await updateStock(o.product, o.quantity);
    });
  }
  order.orderStatus = req.body.status;

  if (req.body.status === "Delivered") {
    order.deliveredAt = Date.now();
  }

  await order.save({ validateBeforeSave: false });
  res.status(200).json({
    success: true,
  });
});

async function updateStock(id, quantity) {
  const product = await Product.findById(id);

  product.Stock -= quantity;

  await product.save({ validateBeforeSave: false });
}

// delete Order -- Admin
exports.deleteOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHander("Order not found with this Id", 404));
  }

  await order.remove();

  res.status(200).json({
    success: true,
  });
});
