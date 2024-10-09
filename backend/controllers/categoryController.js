const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Category = require("../models/categoryModel");
const ErrorHandler = require("../utils/errorhander");

// Create category
exports.createCategory = catchAsyncErrors(async (req, res, next) => {
    console.log(req.body);

    const { level0, level1 } = req.body;

    // Find if a category with the level0 already exists
    let category = await Category.findOne({ level0 });

    if (!category) {
        // If no category exists, create a new one
        category = new Category({
            level0,
            level1: [{
                name: level1.name,
                slug: level1.slug,
                orderNo: level1.orderNo,
                level2: level1.level2 || [] // Ensure level2 is an array
            }]
        });
    } else {
        // Check if the level1 category already exists
        let existingLevel1 = category.level1.find(l1 => l1.name === level1.name);

        // Check for unique slugs across level1 and level2
        let slugExistsInLevel1 = category.level1.some(l1 => l1.slug === level1.slug);
        let slugExistsInLevel2 = category.level1.some(l1 => l1.level2.some(l2 => l2.slug === level1.slug));

        if (slugExistsInLevel1 || slugExistsInLevel2) {
            return next(new ErrorHandler(`Slug '${level1.slug}' already exists.`, 400));
        }

        if (!level1.level2) {
            // If level2 does not exist, handle level1 only
            if (existingLevel1) {
                return next(new ErrorHandler(`Category '${level1.name}' already exists.`, 400));
            }

            // If category exists, push the new level1
            category.level1.push({
                name: level1.name,
                slug: level1.slug,
                orderNo: level1.orderNo,
                level2: level1.level2 || [] // Ensure level2 is an array
            });
        } else {
            // Handle level2 categories
            if (!existingLevel1) {
                return next(new ErrorHandler(`Parent category '${level1.name}' does not exist.`, 400));
            }

            let existingLevel2 = existingLevel1.level2.find(l2 => l2.name === level1.level2.name);
            let level2SlugExists = existingLevel1.level2.some(l2 => l2.slug === level1.level2.slug);

            // Check for unique slugs in level2
            let slugExistsInOtherLevel2 = category.level1.some(l1 => l1.level2.some(l2 => l2.slug === level1.level2.slug));

            if (existingLevel2 || level2SlugExists || slugExistsInOtherLevel2) {
                if (existingLevel2) {
                    return next(new ErrorHandler(`Subcategory '${level1.level2.name}' already exists.`, 400));
                } else {
                    return next(new ErrorHandler(`Subcategory slug '${level1.level2.slug}' already exists.`, 400));
                }
            }

            // Add the new level2 category
            existingLevel1.level2.push({
                name: level1.level2.name,
                slug: level1.level2.slug,
                orderNo: level1.level2.orderNo,
            });
        }
    }

    // Save the category
    await category.save();
    let categories = await Category.find().sort({ level0: 1, level1: 1, level2: 1 });

    res.status(201).json({
        success: true,
        categories
    });
});

// Get all categories
exports.getCategories = catchAsyncErrors(async (req, res, next) => {
    let categories = await Category.find().sort({ level0: 1, level1: 1, level2: 1 });

    res.status(200).json({
        success: true,
        categories
    });
});

// Edit Category
exports.editCategory = catchAsyncErrors(async (req, res, next) => {
    const { id, level0, newLevel0, level1, newLevel1, name, orderNo, slug } = req.body;
    console.log(req.body);

    // Find the original category with the specified level0
    let category = await Category.findOne({ level0 });
    console.log(category, "category");

    if (!category) {
        return next(new ErrorHandler(`Category with level0 '${level0}' not found`, 404));
    }

    // Check for changes in level0 or level1
    if (newLevel0 || newLevel1) {
        let newCategory = await Category.findOne({ level0: newLevel0 || level0 });

        if (!newCategory) {
            // Create a new category if newLevel0 does not exist
            newCategory = new Category({ level0: newLevel0 || level0, level1: [] });
        }

        if (newLevel1) {
            // Handle the movement of subcategories between level1 and level0
            let existingLevel1 = newCategory.level1.find(l1 => l1.name === newLevel1);
            if (!existingLevel1) {
                existingLevel1 = { name: newLevel1, level2: [] };
                newCategory.level1.push(existingLevel1);
            }

            if (existingLevel1.level2.some(l2 => l2.name === name && l2._id.toString() !== id.toString())) {
                return next(new ErrorHandler(`Subcategory name '${name}' already exists under level0 '${newLevel0 || level0}'.`, 400));
            }

            if (existingLevel1.level2.some(l2 => l2.slug === slug && l2._id.toString() !== id.toString())) {
                return next(new ErrorHandler(`Subcategory slug '${slug}' already exists under level0 '${newLevel0 || level0}'.`, 400));
            }

            // Move the level2 category from the old level1 to the new level1
            let oldLevel1 = category.level1.find(l1 => l1.name === level1);
            let level2Category = oldLevel1.level2.find(l2 => l2._id.toString() === id.toString());
            oldLevel1.level2 = oldLevel1.level2.filter(l2 => l2._id.toString() !== id.toString());

            // Add to the new level1
            existingLevel1.level2.push(level2Category);

        } else {
            if (newCategory.level1.some(l1 => l1.name === name && l1._id.toString() !== id.toString())) {
                return next(new ErrorHandler(`Level1 category name '${name}' already exists under level0 '${newLevel0 || level0}'.`, 400));
            }

            if (newCategory.level1.some(l1 => l1.slug === slug && l1._id.toString() !== id.toString())) {
                return next(new ErrorHandler(`Level1 category slug '${slug}' already exists under level0 '${newLevel0 || level0}'.`, 400));
            }

            // Move the level1 category from the old level0 to the new level0
            let level1Category = category.level1.find(l1 => l1._id.toString() === id.toString());
            category.level1 = category.level1.filter(l1 => l1._id.toString() !== id.toString());

            // Add to the new level0
            newCategory.level1.push(level1Category);
        }

        // Save both categories
        await category.save();
        await newCategory.save();

        res.status(200).json({
            success: true,
            message: 'Category moved and updated successfully',
        });
    } else {
        if (level1) {
            // Handling edit for level2 subcategory
            let existingLevel1 = category.level1.find(l1 => l1.name === level1);

            if (!existingLevel1) {
                return next(new ErrorHandler(`Level1 category '${level1}' not found`, 404));
            }

            let level2Category = existingLevel1.level2.find(l2 => l2._id.toString() === id.toString());

            if (!level2Category) {
                return next(new ErrorHandler(`Subcategory with ID '${id}' not found`, 404));
            }

            // Validate uniqueness of name and slug for level2
            let nameExists = existingLevel1.level2.some(l2 => l2.name === name && l2._id.toString() !== id.toString());
            let slugExists = existingLevel1.level2.some(l2 => l2.slug === slug && l2._id.toString() !== id.toString());

            // Check slug uniqueness across all level1 and level2 categories
            let slugExistsInLevel1 = category.level1.some(l1 => l1.slug === slug && l1._id.toString() !== id.toString());
            let slugExistsInLevel2 = category.level1.some(l1 => l1.level2.some(l2 => l2.slug === slug && l2._id.toString() !== id.toString()));

            if (nameExists) {
                return next(new ErrorHandler(`Subcategory name '${name}' already exists.`, 400));
            }

            if (slugExists || slugExistsInLevel1 || slugExistsInLevel2) {
                return next(new ErrorHandler(`Subcategory slug '${slug}' already exists.`, 400));
            }

            // Swap orderNo if necessary
            if (orderNo !== level2Category.orderNo) {
                let existingOrderNoCategory = existingLevel1.level2.find(l2 => l2.orderNo === orderNo);

                if (existingOrderNoCategory) {
                    existingOrderNoCategory.orderNo = level2Category.orderNo;
                }

                level2Category.orderNo = orderNo;
            }

            // Update level2 category
            level2Category.name = name;
            level2Category.slug = slug;

        } else {
            // Handling edit for level1 category
            let level1Category = category.level1.find(l1 => l1._id.toString() === id.toString());

            if (!level1Category) {
                return next(new ErrorHandler(`Level1 category with ID '${id}' not found`, 404));
            }

            // Validate uniqueness of name and slug for level1
            let nameExists = category.level1.some(l1 => l1.name === name && l1._id.toString() !== id.toString());
            let slugExistsInLevel1 = category.level1.some(l1 => l1.slug === slug && l1._id.toString() !== id.toString());
            let slugExistsInLevel2 = category.level1.some(l1 => l1.level2.some(l2 => l2.slug === slug));

            if (nameExists) {
                return next(new ErrorHandler(`Level1 category name '${name}' already exists.`, 400));
            }

            if (slugExistsInLevel1 || slugExistsInLevel2) {
                return next(new ErrorHandler(`Slug '${slug}' already exists.`, 400));
            }

            // Swap orderNo if necessary
            if (orderNo !== level1Category.orderNo) {
                let existingOrderNoCategory = category.level1.find(l1 => l1.orderNo === orderNo);

                if (existingOrderNoCategory) {
                    existingOrderNoCategory.orderNo = level1Category.orderNo;
                }

                level1Category.orderNo = orderNo;
            }

            // Update level1 category
            level1Category.name = name;
            level1Category.slug = slug;
        }

        // Save the updated category
        await category.save();

        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
        });
    }
});


