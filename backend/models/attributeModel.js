const mongoose = require("mongoose");

// attributes for category levels = level0, level2, level3

const AttributeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    variant: {
        type: String,
        default: false,
        required: true,
    },
    values: [{
        type: String,
        required: true,
    }],
    level0: [{
        type: String,
        ref: "Category",
        require: true,
    }],
    level1: [{
        type: String,
        ref: "Category",
    }],
    level2: [{
        type: String,
        ref: "Category",
    }],
});

const Attribute = mongoose.model("Attribute", AttributeSchema);

module.exports = Attribute;
