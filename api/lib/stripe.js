import Stripe from "stripe";

import Mailer from './mailer';


const stripe = Stripe(process.env.STRIPE_SECRET);

export class Stripe_Api {
    constructor() {
        this.stripe_secret = process.env.STRIPE_SECRET;
    }

    async create_stripe_session(order) {
        if (order) {
            try {
                const search = {
                    data: [],
                    ids: []
                }
                order.products.map(obj => {
                    search.data.push({ id: obj.id, quantity: obj.quantity })
                    search.ids.push(obj.id)
                });

                const products = await stripe.products.list({
                    ids: search.ids
                }, {
                    apiKey: this.stripe_secret
                });

                const new_arr = search.data.map(item => {

                    const element = products.data.find(obj => obj.id === item.id)
                    if (element) {
                        return { quantity: item.quantity, price: element.default_price }
                    }
                })

                const session = await stripe.checkout.sessions.create({
                    shipping_address_collection: { allowed_countries: ['DE'] },
                    line_items: new_arr,
                    mode: 'payment',
                    success_url: `${process.env.PUBLIC_URL}?success=true`,
                    cancel_url: `${process.env.PUBLIC_URL}?canceled=true`,
                }, {
                    apiKey: this.stripe_secret
                });
                return { status: true, data: session.url }
            } catch (error) {
                const mailer = new Mailer();
                mailer.send_email("supersnus1331@gmail.com", "error", "error", { error: error, logs: "https://dashboard.stripe.com/test/logs" })
                return { status: false, data: "Sorry, we are having some problems with trafic right now. Please, try agein later" }
            }
        }
        return { status: false, data: "No order" }
    }

    async create_product(id = "", name = "", price = "", filename = []) {

        const photos = filename.map(photo => process.env.API_URL + "/img/" + photo)
        console.log(photos)

        return await stripe.products.create({
            id: id,
            name: name,
            default_price_data: {
                currency: "EUR",
                unit_amount_decimal: price.toString(),
            },
            shippable: true,
            url: process.env.PUBLIC_URL + id,
            images: photos
        }, {
            apiKey: this.stripe_secret
        });
    }

    async update_product(id = "", name = "", filename = []) {
        try {

            return await stripe.products.update(
                id,
                {
                    name: name,
                    shippable: true,
                    url: process.env.PUBLIC_URL + id,
                    images: filename
                },
                {
                    apiKey: this.stripe_secret
                }
            )
        } catch (error) {
            return "No product on stripe"
        }
    }
}