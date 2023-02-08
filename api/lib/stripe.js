import Stripe from "stripe";

import Mailer from './mailer';


const stripe = new Stripe(process.env.STRIPE_SECRET);

export class Stripe_Api {

    constructor() {
        this.stripe_secret = process.env.STRIPE_SECRET;
    }

    report_error(error_name = "", stack = "") {
        const mailer = new Mailer();
        console.log(stack)
        return mailer.send_email(process.env.ADMIN_EMAIL, error_name, "error", { error: stack, logs: "https://dashboard.stripe.com/test/logs" })
    }

    async create_client(name = { name: "", surname: "" }, email = "") {
        const customer = await stripe.customers.create({
            name: name.name + " " + name.surname,
            email: email,
        });
        return customer
    }

    async create_stripe_session(order = {}) {
        if (order) {
            try {

                const search = {
                    products: [],
                    ids: []
                }

                order.products.map(obj => {
                    search.products.push({ id: obj.id, quantity: obj.quantity })
                    search.ids.push(obj.id)
                });

                const products = await stripe.products.list({
                    ids: search.ids
                }, {
                    apiKey: this.stripe_secret
                });

                search.ids = []
                search.products.map(item => {

                    const element = products.data.find(obj => obj.id === item.id)
                    if (element) {
                        return search.ids.push({ quantity: item.quantity, price: element.default_price })
                    }
                })

                const session_object = {
                    shipping_address_collection: { allowed_countries: ['DE'] },
                    line_items: search.ids,
                    mode: 'payment',
                    success_url: `${process.env.PUBLIC_URL}/order?success=true`,
                    cancel_url: `${process.env.PUBLIC_URL}/order?success=false`,
                }

                if (order.id) {
                    session_object.client_reference_id = order.id
                }

                if (order.user) {
                    session_object.customer_email = order.user
                }

                const session = await stripe.checkout.sessions.create({
                    shipping_address_collection: { allowed_countries: ['DE'] },
                    line_items: search.ids,
                    mode: 'payment',
                    success_url: `${process.env.PUBLIC_URL}/order?success=true`,
                    cancel_url: `${process.env.PUBLIC_URL}/order?success=false`,
                }, {
                    apiKey: this.stripe_secret
                });

                return { status: true, data: session.url }
            } catch (error) {
                this.report_error("Error on Stripe Session", error.stack)
                return { status: false, data: "Sorry, we are having some problems with trafic right now. Please, try agein later" };
            }
        }
        this.report_error("No order Stripe", error.stack)
        return { status: false, data: "No order" }
    }

    async create_product(id = "", name = "", price = 0, filename = []) {

        const photos = filename.map(photo => process.env.API_URL + "/img/" + photo)
        console.log(price)
        try {
            const result = await stripe.products.create({
                id: id,
                name: name,
                default_price_data: {
                    currency: "EUR",
                    unit_amount_decimal: (price).toString(),
                },
                shippable: true,
                url: process.env.PUBLIC_URL + "/products" + id,
                images: photos
            }, {
                apiKey: this.stripe_secret
            });
            return { status: true, data: result }
        } catch (error) {
            this.report_error("Error on Stripe create product", error.stack)
            return { status: false, data: error }
        }
    }


    async create_new_price(product_id = "", price = "", active = true) {
        try {
            const new_price = await stripe.prices.create({
                product: product_id,
                unit_amount: (price * 100).toString(),
                currency: 'eur',
                product: product_id,
                active: active
            }, {
                apiKey: this.stripe_secret
            });
            return { status: true, data: new_price }
        } catch (error) {
            this.report_error("Error on Stripe create price", error.stack)
            return { status: false, data: "error price" }
        }

    }

    async update_product(id = "", name = "", filename = [], price = "") {
        const product_on_stripe = await stripe.products.retrieve(id, {
            apiKey: this.stripe_secret
        });

        if (product_on_stripe) {
            try {
                const photos = filename.map(photo => process.env.API_URL + "/img/" + photo)

                const price_obj = await new Stripe_Api().create_new_price(id, price, true)

                const updated = await stripe.products.update(
                    id,
                    {
                        name: name,
                        shippable: true,
                        url: process.env.PUBLIC_URL + "/products" + id,
                        images: photos,
                        default_price: price_obj.data.id
                    },
                    {
                        apiKey: this.stripe_secret
                    }
                )

                await stripe.prices.update(
                    product_on_stripe.default_price,
                    {
                        active: false
                    },
                    {
                        apiKey: this.stripe_secret
                    }
                )

                return { status: true, data: updated }
            } catch (error) {
                this.report_error("Error on Stripe update product", error.stack)
                return { status: false, data: error }
            }
        } else {
            this.report_error("No product on stripe", "no stack")
            return { status: false, data: "No product on stripe" }
        }
    }
}