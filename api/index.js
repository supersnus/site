import express from "express";
import { crossOriginResourcePolicy } from 'helmet';
import { config } from "dotenv"
import cors from "cors"

import { connect } from "./db/init.js"
import { products } from './controllers/products';
import { error_handler } from "./middlewares/error_handler";
import { auth } from "./controllers/auth";
import { payment } from "./controllers/payment";
import { reviews } from "./controllers/reviews";
import { admin } from "./controllers/admin";
import { upload_photos } from "./lib/files/photo";
import { auth_middleware } from "./middlewares/auth_handler";
import { user_router } from "./controllers/user";


// SETUP

config({ path: "../.env" })

if (process.env.NODE_ENV !== "production") {
  process.env.API_PORT = 4000;
  process.env.API_URL = "http://localhost:4000/api";
  process.env.PUBLIC_URL = "http://localhost:3000";
  process.env.NODE_ENV = "development"
}

connect();

const app = express()
  .disable('x-powered-by')
  .use(crossOriginResourcePolicy({ policy: "cross-origin" }))
  .use(express.json())
  .use(cors())
  .use(express.urlencoded({ extended: false }))
  // ROUTES

  .use('/api/img', express.static('./public/img'))
  .use("/api/products", products)
  .use("/api/reviews", reviews)
  .use("/api/auth", auth)
  .use("/api/payment", auth_middleware, payment)
  .use("/api/admin", admin)
  .use("/api/user", auth_middleware, user_router)
  .use(error_handler)

app.listen(process.env.API_PORT, () => {
  console.log(`app is listening to port ${process.env.API_PORT}`)
})