import dotenv from "dotenv";
dotenv.config();
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_API_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_API_SECRET_KEY is required in environment variables");
}

const stripe = new Stripe(stripeSecretKey);

export default stripe;
