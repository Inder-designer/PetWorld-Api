const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/errorhander");
const Attribute = require("../models/attributeModel");
const Category = require("../models/categoryModel");

// Create Attribute
exports.createAttribute = catchAsyncErrors(async (req, res, next) => {
    console.log(req.body, "body");
    const { name, values, level0, level1, level2, variant } = req.body;

    // Validate input
    if (!name || !values.length || !Array.isArray(level0)) {
        return next(new ErrorHandler('Name, values, and level0 are required', 400));
    }

    // Check if attribute with the same name and level0 already exists
    const existingAttributes = await Attribute.find({ name });
    if (existingAttributes.length) {
        // Iterate over existing attributes and check level0
        for (const attr of existingAttributes) {
            // Check if any of the existing level0 values match the provided level0 values
            const isLevel0Same = attr.level0.some(l0 => level0.includes(l0));
            if (isLevel0Same) {
                return next(new ErrorHandler('Attribute with this name already exists under the same level0', 400));
            }
        }
    }

    // Check if all level0 values exist
    if (level0.length) {
        const categoriesLevel0 = await Category.find({ level0 });
        if (categoriesLevel0.length !== level0.length) {
            return next(new ErrorHandler('level0 values do not exist', 400));
        }
    }

    // Check if all level1 values exist
    if (level1 && level1.length) {
        // Find categories where level1 names match and ensure they are under one of the provided level0
        const categoriesLevel1 = await Category.find({
            'level1.name': { $in: level1 },
            'level0': { $in: level0 }
        });

        // Extract level1 names from categories
        const level1Names = categoriesLevel1.flatMap(category => category.level1.map(l1 => l1.name));

        // Check if all provided level1 values are present in the retrieved categories
        const missingLevel1Values = level1.filter(l1 => !level1Names.includes(l1));
        console.log(missingLevel1Values, "missingLevel1Values");
        if (missingLevel1Values.length) {
            return next(new ErrorHandler(`One or more level1 values do not exist under the provided level0: ${missingLevel1Values.join(', ')}`, 400));
        }
    }

    // Check if all level2 values exist
    if (level2 && level2.length) {
        // Find categories where level2 names match and ensure they are under one of the provided level1 and level0
        const categoriesLevel2 = await Category.find({
            'level1.name': { $in: level1 },
            'level0': { $in: level0 }
        });

        // Extract level2 names from matching categories
        const level2Names = categoriesLevel2.flatMap(category =>
            category.level1.flatMap(l1 =>
                l1.level2.filter(l2 => level2.includes(l2.name)).map(l2 => l2.name)
            )
        );

        // Check if all provided level2 values are present in the retrieved categories
        const missingLevel2Values = level2.filter(l2 => !level2Names.includes(l2));
        console.log(missingLevel2Values, "missingLevel2Values");
        if (missingLevel2Values.length) {
            return next(new ErrorHandler(`One or more level2 values do not exist under the provided level1 and level0: ${missingLevel2Values.join(', ')}`, 400));
        }
    }

    // Create new attribute
    const newAttribute = new Attribute({
        name,
        values,
        level0,
        level1,
        level2,
        variant
    });

    await newAttribute.save();
    const attributes = await Attribute.find();

    res.status(201).json({
        success: true,
        message: `Attribute "${name}" created successfully`,
        attributes
    });
});

// Edit Attribute
exports.editAttribute = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    console.log(id);
    const { name, values, level0, level1, level2, variant } = req.body;

    // Find the attribute to update
    const existingAttribute = await Attribute.findById(id);
    if (!existingAttribute) {
        return next(new ErrorHandler('Attribute not found', 404));
    }

    // Check for name and level0 uniqueness if they are being updated
    if (name && name !== existingAttribute.name) {
        const existingAttributes = await Attribute.find({ name, _id: { $ne: id } });
        if (existingAttributes.length) {
            // Iterate over existing attributes and check level0
            for (const attr of existingAttributes) {
                const isLevel0Same = attr.level0.some(l0 => level0 ? level0.includes(l0) : existingAttribute.level0.includes(l0));
                if (isLevel0Same) {
                    return next(new ErrorHandler('Attribute with this name already exists under the same level0', 400));
                }
            }
        }
    }

    // Validate level0 values if they are being updated
    if (level0) {
        const categoriesLevel0 = await Category.find({ level0 });
        if (categoriesLevel0.length !== level0.length) {
            return next(new ErrorHandler('One or more level0 values do not exist', 400));
        }
    }

    // Validate level1 values if they are being updated
    if (level1) {
        const categoriesLevel1 = await Category.find({
            'level1.name': { $in: level1 },
            'level0': { $in: level0 || existingAttribute.level0 }
        });

        const level1Names = categoriesLevel1.flatMap(category => category.level1.map(l1 => l1.name));
        const missingLevel1Values = level1.filter(l1 => !level1Names.includes(l1));
        if (missingLevel1Values.length) {
            return next(new ErrorHandler(`One or more level1 values do not exist under the provided level0: ${missingLevel1Values.join(', ')}`, 400));
        }
    }

    // Validate level2 values if they are being updated
    if (level2) {
        const categoriesLevel2 = await Category.find({
            'level1.name': { $in: level1 || existingAttribute.level1 },
            'level0': { $in: level0 || existingAttribute.level0 }
        });

        const level2Names = categoriesLevel2.flatMap(category =>
            category.level1.flatMap(l1 =>
                l1.level2.filter(l2 => level2.includes(l2.name)).map(l2 => l2.name)
            )
        );
        const missingLevel2Values = level2.filter(l2 => !level2Names.includes(l2));
        if (missingLevel2Values.length) {
            return next(new ErrorHandler(`One or more level2 values do not exist under the provided level1 and level0: ${missingLevel2Values.join(', ')}`, 400));
        }
    }

    // Update the attributes with provided fields
    if (name) existingAttribute.name = name;
    if (values) existingAttribute.values = values;
    if (level0) existingAttribute.level0 = level0;
    if (level1) existingAttribute.level1 = level1;
    if (level2) existingAttribute.level2 = level2;
    if (variant) existingAttribute.variant = variant;

    await existingAttribute.save();

    res.status(200).json({
        success: true,
        message: 'Attribute updated successfully',
        data: existingAttribute
    });
});

// Get All Attributes
exports.getAllAttributes = catchAsyncErrors(async (req, res, next) => {
    const attributes = await Attribute.find();

    res.status(200).json({
        success: true,
        count: attributes.length,
        attributes: attributes
    });
});

// Get Attribute by ID
exports.getSingleAttribute = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const attribute = await Attribute.findById(id);

    if (!attribute) {
        return next(new ErrorHandler('Attribute not found', 404));
    }

    res.status(200).json({
        success: true,
        data: attribute
    });
});
