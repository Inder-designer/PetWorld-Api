const Product = require("../models/productModel");
const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apifeatures");
const cloudinary = require("cloudinary");

// Create Product -- Admin
exports.createProduct = catchAsyncErrors(async (req, res, next) => {
  try {
    const { name, description, price, discount, level0, level1, level2, Stock, attributes, orderLimit, images, slug, tags, brand } = req.body;
    const newProduct = {
      name,
      description,
      price,
      discount,
      Stock,
      orderLimit,
      slug,
      tags,
      attributes,
      brand,
      categories: { level0: { name: level0 } },  // Initialize the categories structure
    };
    console.log(newProduct.attributes);

    if (level1) {
      newProduct.categories.level0.level1 = { name: level1 };  // Initialize level1
      if (level2) {
        newProduct.categories.level0.level1.level2 = { name: level2 };  // Initialize level2
      }
    }

    console.log(newProduct.categories);

    let imagesArray = [];
    if (typeof images === "string") {
      imagesArray.push(images);
    } else {
      imagesArray = images;
    }

    const imagesLinks = [];
    for (let i = 0; i < imagesArray.length; i++) {
      const result = await cloudinary.uploader.upload(imagesArray[i], {
        folder: "products",
      });

      imagesLinks.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    newProduct.images = imagesLinks;
    newProduct.user = req.user.id;

    const product = await Product.create(newProduct);

    res.status(201).json({
      success: true,
      product,
      message: "Product created"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});


// Get All Product
exports.getAllProducts = catchAsyncErrors(async (req, res, next) => {
  const resultPerPage = 50;
  const productsCount = await Product.countDocuments();

  const apiFeature = new ApiFeatures(Product.find(), req.query)
    .search()
    .filter();

  let products = await apiFeature.query;

  let filteredProductsCount = products.length;

  apiFeature.pagination(resultPerPage);

  products = await apiFeature.query;

  res.status(200).json({
    success: true,
    products,
    productsCount,
    resultPerPage,
    filteredProductsCount,
  });
});

// Get Filtered Products
exports.getFilteredProducts = catchAsyncErrors(async (req, res, next) => {
  const { mainCategory } = req.params; // Get mainCategory from URL parameters
  console.log("Main Category:", mainCategory);

  const {
    category,
    type,
    ratings,
    price,
    stock,
    ...restQueryParams // Capture remaining dynamic query parameters (attributes)
  } = req.query;

  console.log("Query Params:", req.query);

  let query = {
    "categories.level0.name": new RegExp(mainCategory, "i"), // Always filter by mainCategory
  };

  // Filter by level1 category (subCategory) (case-insensitive)
  if (category) {
    query["categories.level0.level1.name"] = new RegExp(category, "i");
  }

  // Filter by level2 category (type) (case-insensitive)
  if (type) {
    query["categories.level0.level1.level2.name"] = new RegExp(type, "i");
  }

  // Filter by ratings
  if (ratings) {
    query.ratings = { $gte: Number(ratings) };
  }

  // Filter by price
  if (price && typeof price === 'object') {
    // Ensure price is an object containing 'gte' and 'lte'
    if (price.gte !== undefined && price.lte !== undefined) {
      query.price = {
        $gte: Number(price.gte),
        $lte: Number(price.lte),
      };
    }
  }

  // Filter by stock (greater than or equal to provided value)
  if (stock) {
    query.Stock = { $gte: Number(stock) };
  }

  // Handle dynamic attributes
  Object.keys(restQueryParams).forEach((param) => {
    const attributeName = param.replace(/\+/g, ' '); // Handle spaces in the attribute name, e.g., "life+stage" -> "life stage"
    const attributeValues = Array.isArray(restQueryParams[param])
      ? restQueryParams[param]
      : [restQueryParams[param]]; // Ensure it's an array

    // If attributeValues is a string, split it
    const valuesArray = attributeValues[0].split('%'); // Use % as a separator for multiple values

    if (attributeName && valuesArray.length) {
      // Build the query to match the attributes field
      query["attributes"] = {
        $elemMatch: {
          name: new RegExp(attributeName, "i"), // Match attribute name (e.g., "Life Stage")
          values: { $in: valuesArray.map(val => new RegExp(val, "i")) } // Match attribute values (e.g., "spicy", "sweet")
        }
      };
    }
  });

  console.log("Final Query:", JSON.stringify(query, null, 2)); // Log the final query for debugging

  const products = await Product.find(query);

  res.status(200).json({
    success: true,
    products,
    productsCount: products.length,
  });
});




// Get All Product (Admin)
exports.getAdminProducts = catchAsyncErrors(async (req, res, next) => {
  const products = await Product.find();

  res.status(200).json({
    success: true,
    products,
  });
});

// Get Product Details
exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

// Update Product -- Admin
exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
  const { name, description, price, discount, level0, attributes, level1, level2, Stock, orderLimit, images, slug, tags, brand } = req.body;

  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  const editProduct = {
    name,
    description,
    price,
    discount,
    Stock,
    orderLimit,
    slug,
    tags,
    brand,
    attributes,
    categories: { level0: { name: level0 } },
  };

  if (level1) {
    editProduct.categories.level0.level1 = { name: level1 };
    if (level2) {
      editProduct.categories.level0.level1.level2 = { name: level2 };
    }
  }

  // Images Handling
  let imagesArray = [];
  if (typeof images === "string") {
    imagesArray.push(images);
  } else if (Array.isArray(images)) {
    imagesArray = images;
  }

  const newImages = [];
  const existingImages = [];

  // Separate new and existing images
  imagesArray.forEach(image => {
    if (typeof image === "string") {
      newImages.push(image);
    } else if (typeof image === "object" && image.url) {
      existingImages.push(image);
    }
  });

  // Upload new images to Cloudinary
  const imagesLinks = [];
  for (let i = 0; i < newImages.length; i++) {
    const result = await cloudinary.v2.uploader.upload(newImages[i], {
      folder: "products",
    });

    imagesLinks.push({
      public_id: result.public_id,
      url: result.secure_url,
    });
  }

  // Combine existing and new images
  editProduct.images = [...existingImages, ...imagesLinks];

  // Delete images from Cloudinary that are no longer in the updated images array
  const productImageIds = product.images.map(image => image.public_id);
  const updatedImageIds = editProduct.images.map(image => image.public_id);

  const imagesToDelete = productImageIds.filter(id => !updatedImageIds.includes(id));

  for (let i = 0; i < imagesToDelete.length; i++) {
    await cloudinary.v2.uploader.destroy(imagesToDelete[i]);
  }

  product = await Product.findByIdAndUpdate(req.params.id, editProduct, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    product,
    message: "Update Successfull!"
  });
});

// Delete Product

exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  // Deleting Images From Cloudinary
  for (let i = 0; i < product.images.length; i++) {
    await cloudinary.v2.uploader.destroy(product.images[i].public_id);
  }

  await product.remove();

  res.status(200).json({
    success: true,
    message: "Product Delete Successfully",
  });
});

// Create New Review or Update the review
exports.createProductReview = catchAsyncErrors(async (req, res, next) => {
  const { rating, comment, productId, title } = req.body;

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
    title,
  };
  console.log(review);
  const product = await Product.findById(productId);

  const isReviewed = product.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString()
  );

  if (isReviewed) {
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user._id.toString())
        (rev.rating = rating), (rev.comment = comment);
    });
  } else {
    product.reviews.push(review);
    product.numOfReviews = product.reviews.length;
  }

  let avg = 0;

  product.reviews.forEach((rev) => {
    avg += rev.rating;
  });

  product.ratings = avg / product.reviews.length;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});

// Get All Reviews of a product
exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.id);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});

// get user submitted products Review
exports.getProductsReviewedByUser = catchAsyncErrors(async (req, res, next) => {
  // console.log(req.user._id);
  const userId = req.user._id;

  // Find products reviewed by the user
  const products = await Product.find({
    "reviews.user": userId
  })

  // Filter reviews to only include the current user's reviews
  const userReviewedProducts = products.map((product) => ({
    productId: product._id,
    name: product.name,
    image: product.images[0].url,
    rating: product.ratings,
    userReview: product.reviews.find(
      (review) => review.user.toString() === userId.toString()
    )
  }));

  res.status(200).json({
    success: true,
    reviews: userReviewedProducts,
  });
});


// Delete Review
exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  const reviews = product.reviews.filter(
    (rev) => rev._id.toString() !== req.query.id.toString()
  );

  let avg = 0;

  reviews.forEach((rev) => {
    avg += rev.rating;
  });

  let ratings = 0;

  if (reviews.length === 0) {
    ratings = 0;
  } else {
    ratings = avg / reviews.length;
  }

  const numOfReviews = reviews.length;

  await Product.findByIdAndUpdate(
    req.query.productId,
    {
      reviews,
      ratings,
      numOfReviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
  });
});
