import bcrypt from "bcryptjs";
import { Router } from "express";
import asyncHandler from "express-async-handler";
import Stripe from "stripe";

import { Users } from "../db/schemas";
import { get_token, verify_token } from "../lib/JWT";
import Mailer from "../lib/mailer";
import { auth_middleware } from "../middlewares/auth_handler";


const auth = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET);

auth.post("/login", asyncHandler(loginUser))
auth.post("/register", asyncHandler(registerUser))

auth.post("/request_reset", asyncHandler(requestResetUser))
auth.post("/reset/:token", asyncHandler(resetUser))

auth.get("/check_token", asyncHandler(check_token))

auth.get("/admin", auth_middleware, asyncHandler(adminLogin))

async function loginUser(req, res) {
    const { email, password } = req.body;
    
    // https://stripe.com/docs/api/payment_intents/object

    if (email && password) {

        const user = await Users.findOne({ email })

        if (user) {
            const hash = await bcrypt.compare(password, user.password);

            if (hash === true) {
                return res.json(get_token(user._id));
            } else {
                res.status(401)
                throw Error("Invalid credentials")
            }
        } else {
            res.status(401)
            throw Error("Invalid credentials")
        }
    } else {
        res.status(401)
        throw Error("Please, fill all fields")
    }
}

async function registerUser(req, res) {
    const { name, surname, email, password, password2 } = req.body;

    if (name && surname && email && password && password2) {

        const user = await Users.findOne({ email })

        if (user) {
            res.status(401)
            throw Error("Sorry, but this e-mail address is already registered")
        }
        const salt = await bcrypt.genSalt(5)
        const hash = await bcrypt.hash(password, salt);
        const are_same = await bcrypt.compare(password2, hash);
        if (!are_same) {
            res.status(401)
            throw Error("Invalid credentials")
        }
        const new_user = await Users.create({ email: email, password: hash, name: name, surname: surname });
        return res.json(get_token(new_user._id));
    } else {
        res.status(400)
        throw new Error("Please, fill all fields")
    }
}

async function check_token(req, res) {

    if (req.headers.authorization) {

        const token = req.headers.authorization.split(' ')[1]
        const response = await verify_token(token)
        if (response.status === true) {
            const user = await Users.findById(response.data.payload)
            if (user) {
                return res.json(response.status)
            } else {
                return res.status(401).json(response.status)
            }
        } else {
            return res.status(401).json(response.status)
        }

    } else {
        res.status(401)
        throw new Error("No token")
    }
}

async function requestResetUser(req, res) {

    const { email } = req.body;
    const user = await Users.findOne({ email: email })

    if (user) {
        const mailer = new Mailer();
        const token = get_token(user.email)
        mailer.send_email(user.email, "Reset your password", "password_reset", { url: `${process.env.PUBLIC_URL}/reset?token=${token}` })
        return res.json({ data: "E-Mail sent" })
    } else {
        throw new Error("Sorry, but there is no user with this e-mail")
    }
}

async function resetUser(req, res) {

    const { token } = req.params;
    const { password, password2 } = req.body;

    const user_email = await verify_token(token)

    if (user_email.status) {

        const user = await Users.findOne({ email: user_email.data.payload })

        if (user) {

            const salt = await bcrypt.genSalt(5)
            const hash = await bcrypt.hash(password, salt);
            const are_same = await bcrypt.compare(password2, hash);
            if (!are_same) {
                res.status(401)
                throw Error("Passwords are not same")
            }
            const update_user = await Users.findByIdAndUpdate(user._id, { password: hash })
            return res.json(get_token(update_user._id));

        } else {
            res.status(401)
            throw new Error("Sorry, something went wrong")
        }
    } else {
        res.status(400)
        throw new Error("Invalid token")
    }
}

async function adminLogin(req, res) {

    const user = await Users.findById(req.user)
    if (user.email === process.env.ADMIN_EMAIL) {
        return res.json(true)
    } else {
        return res.status(400).json(false)
    }

}


export default auth;