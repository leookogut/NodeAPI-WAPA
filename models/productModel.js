const mongoose = require("mongoose");

const productSchema = mongoose.Schema(
    {
        id_ticket: {
            type: String,
            required: [true, "Please enter id"],
            default: 0,
        },
        seller_name: {
            type: String,
            required: false,
        },
        seller_amount: {
            type: Number,
            required: true,
        },
        chave_Pix: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const disparoWA = mongoose.Schema(
    {
        seller_name: {
            type: String,
            required: false,
        },
        seller_phone: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

//const Product = mongoose.model("Product", productSchema);

const Product = mongoose.model("Product", disparoWA);

module.exports = Product;
