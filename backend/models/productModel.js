const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Enter product Name"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Please Enter product Description"],
  },
  price: {
    type: Number,
    required: [true, "Please Enter product Price"],
  },
  discount: {
    type: Number,
    default: 0,
  },
  categories: {
    level0: {
      name: {
        type: String,
        required: true
      },
      level1: {
        name: {
          type: String,
        },
        level2: {
          name: {
            type: String,
          },
        },
      },
    }
  },
  brand: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
  },
  // tags
  tags: [
    {
      type: String,
      default: null
    }
  ],
  // Attributes name & values
  attributes: [
    {
      name: {
        type: String,
        default: null,
      },
      values: [
        {
          type: String,
          default: null,
        }
      ],
    }
  ],
  ratings: {
    type: Number,
    default: 0,
  },
  images: [
    {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  ],
  Stock: {
    type: Number,
    required: [true, "Please Enter product Stock"],
    default: 1,
  },
  orderLimit: {
    type: Number,
    default: 1,
  },
  numOfReviews: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
      title: {
        type: String,
        required: false,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Product", productSchema);
