const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { UserAddress } = require("../models/addressModel");
const ErrorHandler = require("../utils/errorhander");

// Add Address
exports.addAddress = catchAsyncErrors(async (req, res, next) => {
    const { address } = req.body;

    // Ensure the address object is defined
    if (!address) {
        return next(new ErrorHandler("Address details are required", 400));
    }

    const userId = req.user.id;

    // Create a new address object based on AddressSchema
    const newAddress = {
        mobile: address.mobile,
        name: address.name,
        addressType: address.addressType,
        city: address.city,
        country: address.country,
        isDefault: address.isDefault || false,
        landmark: address.landmark || null,
        locality: address.locality,
        notAvailableDays: address.notAvailableDays || [],
        pincode: address.pincode,
        state: address.state,
        streetAddress: address.streetAddress,
    };
    console.log(newAddress, "newAddress");

    // Find the user's addresses
    let userAddresses = await UserAddress.findOne({ userId });

    // console.log(newAddress.isDefault);

    // If userAddresses not found, create a new UserAddress document
    if (!userAddresses) {
        userAddresses = new UserAddress({
            _id: userId, // Assuming userId is used as _id for UserAddress
            userId,
            addresses: [newAddress]
        });
    } else {
        // If new address is isDefault true and already isDefault address is exist 
        if (newAddress.isDefault === true) {
            const checkDefaut = userAddresses.addresses.find(item => item.isDefault === true)
            console.log(checkDefaut, "checkDefault");
            if (checkDefaut) {
                checkDefaut.isDefault = false
            }
        }
        // Add the new address to the existing addresses array
        userAddresses.addresses.push(newAddress);
    }

    // Save the updated userAddresses document
    await userAddresses.save();

    res.status(201).json({
        success: true,
        message: "Address added successfully",
        userAddresses
    });
});

// Get Address
exports.getAddress = catchAsyncErrors(async (req, res, next) => {
    try {
        const userId = req.user._id;
        const userAddresses = await UserAddress.findOne({ userId });
        res.status(200).json({
            success: true,
            message: "Address retrieved successfully",
            userAddresses
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error
        });
    }
});

// Update Address
exports.updateAddress = catchAsyncErrors(async (req, res, next) => {
    const { address } = req.body;

    try {
        const userId = req.user._id;
        const userAddresses = await UserAddress.findOne({ userId });

        // Find the address to be updated
        const existAddress = userAddresses.addresses.id(req.params.id);

        // If address not found
        if (!existAddress) {
            return next(new ErrorHandler("Address not found", 404));
        }

        // If the updated address is set as default
        if (address.isDefault === true) {
            const checkDefaut = userAddresses.addresses.find(item => item.isDefault === true)
            if (checkDefaut) {
                checkDefaut.isDefault = false
            }
        }

        // Update only allowed fields
        const updateFields = [
            'mobile', 'name', 'addressType', 'city', 'country', 'isDefault',
            'landmark', 'locality', 'notAvailableDays', 'pincode', 'state',
            'streetAddress'
        ];

        updateFields.forEach(field => {
            if (address[field] !== undefined) {
                existAddress[field] = address[field];
            }
        });

        // Save the updated userAddresses document
        await userAddresses.save();

        console.log(userAddresses, "userAddresses");

        res.status(200).json({
            success: true,
            message: "Address updated successfully",
            userAddresses
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error
        });
    }
});

// Delete Address
exports.deleteAddress = catchAsyncErrors(async (req, res, next) => {
    try {
        const userId = req.user._id;
        const userAddresses = await UserAddress.findOne({ userId });
        // Find the address to be updated
        const existAddress = userAddresses.addresses.id(req.params.id);

        // If address not found
        if (!existAddress) {
            return next(new ErrorHandler("Address not found", 404));
        }
        const index = userAddresses.addresses.findIndex(address => address._id == req.params.id);
        userAddresses.addresses.splice(index, 1);
        await userAddresses.save();
        res.status(200).json({
            success: true,
            message: "Address deleted successfully",
            userAddresses
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error
        });
    }
});