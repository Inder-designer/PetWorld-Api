const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the address sub-schema
const AddressSchema = new Schema({
    mobile: { type: String, required: true },
    name: { type: String, required: true },
    addressType: { type: String, enum: ['HOME', 'OFFICE'], required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
    landmark: { type: String, default: null },
    locality: { type: String, required: true },
    notAvailableDays: { type: [String], default: ["SATURDAY", "SUNDAY"] },
    pincode: { type: String, required: true },
    state: { type: String, required: true },
    streetAddress: { type: String, required: true },
});

// Define the main schema
const UserAddressSchema = new Schema({
    _id: { type: String, required: true }, // Assuming _id is a String as per your example
    userId: { type: String, required: true },
    addresses: { type: [AddressSchema], default: [] }
});

// Create a model based on the schema
module.exports = {
    UserAddress: mongoose.model('UserAddress', UserAddressSchema),
    AddressSchema
}
