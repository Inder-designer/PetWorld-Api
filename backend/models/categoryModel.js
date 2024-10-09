const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
    level0: {
        type: String,
        enum: ["dog", "cat", "otherPets"],
        required: true,
    },
    level1: [
        {
            name: {
                type: String,
                required: true,
            },
            slug: {
                type: String,
                required: true,
            },
            orderNo: {
                type: Number,
                required: true,
            },
            level2: [
                {
                    name: {
                        type: String,
                    },
                    slug: {
                        type: String,
                    },
                    orderNo: {
                        type: Number,
                        required: true,
                    },
                }
            ]
        }
    ]
});

const Category = mongoose.model("Category", CategorySchema);

module.exports = Category;
