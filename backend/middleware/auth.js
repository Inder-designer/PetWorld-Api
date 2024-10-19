const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
  let token;

  // Check for token in cookies, session, or Authorization header
  if (req.cookies.token) {
    token = req.cookies.token;
  } else if (req.session.token) {
    token = req.session.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Ensure the Authorization header exists and starts with "Bearer"
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ErrorHander("Please Login to access this resource", 401));
  }
  const decodedData = jwt.verify(token, process.env.JWT_SECRET);

  req.user = await User.findById(decodedData.id);

  next();
});

exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHander(
          `Role: ${req.user.role} is not allowed to access this resouce `,
          403
        )
      );
    }

    next();
  };
};
