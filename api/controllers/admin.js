import { Router } from "express";
import asyncHandler from "express-async-handler";

import { Products } from "../db/products";
import { delete_photos, find_files_on_server } from "../lib/files/files";
import { create_product, update_product } from "../lib/stripe";
import { upload_photos } from "../lib/files/photo";


export const admin = Router();

admin.post("/add", upload_photos, asyncHandler(add_product))
admin.post("/edit", upload_photos, asyncHandler(edit_product))

async function add_product(req, res) {

    const { name, text, price, quantity, technical_data, product_text } = req.body;
    console.log("stack")
    try {
        const filename = req.files.map((item) => item.filename)

        const product = await Products.create({ text: text, name: name, price: price, photos: filename, quantity: quantity, technical_data: technical_data, product_text: JSON.parse(product_text) })
        await create_product(product.id, name, price, filename)

        return res.json()

    } catch (error) {

        if (error.name === "MongoServerError") {
            return res.status(400).json(error.message)
        }
        res.status(400)
        throw new Error(error)
    }
}

async function edit_product(req, res) {
    console.log("stack")
    const { text, name, price, quantity, id, technical_data, remaining_photos } = req.body;

    const filename = req.files.map((item) => item.filename)

    const item = await Products.findById(id)

    console.log("stack")

    if (item) {
        console.log("stack")
        try {

            const difference = item.photos.filter(data => !remaining_photos?.includes(data, 0))

            const files_to_delete = await find_files_on_server(difference)
            console.log("files_to_delete")
            if (files_to_delete.same) {
                delete_photos(files_to_delete)
            }

            const files_to_update = [...filename, ...(item.photos.filter(data => remaining_photos?.includes(data)))]

            await item.updateOne({ text: text, name: name, price: price, photos: files_to_update, quantity: quantity, technical_data: technical_data })
                .then(
                    async () => await update_product(id, name, filename, price)
                )
                .catch((onrejected) => {
                    res.status(500)
                    throw new Error(onrejected)
                })

            return res.json()

        } catch (error) {
            res.status(400)
            throw new Error(error)
        }
    } else {
        res.status(400)
        throw new Error("No items specified")
    }
}