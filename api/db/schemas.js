import mongoose from 'mongoose';


const { Schema } = mongoose;

const products_schema = new Schema({
    name: {
        type: String,
        required: [true, "Please add NAME"],
        unique: true,
        dropDups: true,
        index: true,

    },
    photos: {
        type: [String],
        required: [true, "Please add PHOTO"]
    },
    tags: {
        type: Object,
    },
    text: {
        type: String,
        required: [true, "Please add TEXT"],
        unique: true, dropDups: true
    },
    price: {
        type: Number,
        required: [true, "Please add PRICE"],
    },
    quantity: {
        type: Number,
        required: [true, "Please add QUANTITY"],
    }

}, {
    timestamps: true
});

const users_schema = new Schema({
    name: {
        type: String,
        required: [true, "Please add your NAME"],
    },
    surname: {
        type: String,
        required: [true, "Please add your SURNAME"],
    },
    address: {
        type: String,
        // required: [true, "Please add your ADDRESS"],
    },
    email: {
        type: String,
        required: [true, "Please add your EMAIL"],
        unique: true,
        index: true,
    },
    password: {
        type: String,
        required: [true, "Please add your PASSWORD"],
    },
}, {
    timestamps: true
});

const orders_schema = {
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'Users',
        required: [true, "Please add your USER_ID"],

    },
    address: {
        type: Object,
    },
    products: {
        type: [
            {
                product: {
                    type: mongoose.Types.ObjectId,
                    ref: 'Products',
                    unique: false
                },
                quantity: {
                    type: Number,

                }
            }
        ]
    },
    tags: {
        type: Object,
        default: { payed: false, pending: false, rejected: false }
    },
}

export const Users = mongoose.model('Users', users_schema);
export const Orders = mongoose.model('Orders', orders_schema);
export const Products = mongoose.model('Products', products_schema);