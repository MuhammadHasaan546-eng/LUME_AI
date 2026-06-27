import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },

    avatar: {
      type: String,
      default: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    },
    credits: {
      type: Number,
      default: 100,
      min: 0,
    },
    plan: {
      type: String,
      enum: ["free", "premium", "enterprise"],
      default: "free",
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
    stripeSubscriptionId: {
      type: String,
      default: null,
    },
    subscriptionStatus: {
      type: String,
      enum: [
        "inactive",
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "incomplete",
        "incomplete_expired",
        "paused",
      ],
      default: "inactive",
    },
    currentPeriodEnd: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

export default User;
