import { STRIPE_PLANS } from "../config/plain.js";
import stripe from "../config/stripe.js";
import User from "../models/User.models.js";
import ApiResponse from "../utils/ApiResponse.js";
import ExpressError from "../utils/ExpressError.js";
import wrapAsync from "../utils/wrapAsync.js";

export const createCheckoutSession = wrapAsync(async (req, res, next) => {
  const { planType, billingPeriod = "monthly" } = req.body;
  const userId = req.user.id;
  const plan = STRIPE_PLANS[planType];

  if (!plan) {
    throw new ExpressError("Invalid plan selected", 400);
  }

  const selectedPrice = plan.prices?.[billingPeriod];

  if (!selectedPrice?.priceId) {
    throw new ExpressError(
      `${plan.name} ${billingPeriod} Stripe price ID is not configured`,
      500,
    );
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ExpressError("User not found", 404);
  }

  const clientUrl = process.env.CLIENT_URL || process.env.HOSTING_BASE_URL;

  if (!clientUrl) {
    throw new ExpressError(
      "CLIENT_URL or HOSTING_BASE_URL is not configured",
      500,
    );
  }

  let customerId = user.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: user._id.toString(),
      },
    });

    customerId = customer.id;
    user.stripeCustomerId = customerId;
    await user.save();
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer: customerId,
    line_items: [
      {
        price: selectedPrice.priceId,
        quantity: 1,
      },
    ],
    metadata: {
      userId: user._id.toString(),
      planType,
      billingPeriod,
      credits: String(plan.credits),
    },
    subscription_data: {
      metadata: {
        userId: user._id.toString(),
        planType,
        billingPeriod,
        credits: String(plan.credits),
      },
    },
    success_url: `${clientUrl}/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${clientUrl}/pricing?checkout=cancelled`,
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { sessionId: session.id, url: session.url },
        "Stripe checkout session created successfully",
      ),
    );
});

export const billing_controller = createCheckoutSession;

export const verifyCheckoutSession = wrapAsync(async (req, res, next) => {
  const { sessionId } = req.query;
  const userId = req.user.id;

  if (!sessionId) {
    throw new ExpressError("Stripe checkout session ID is required", 400);
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  if (session.metadata?.userId !== userId) {
    throw new ExpressError(
      "Checkout session does not belong to this user",
      403,
    );
  }

  if (session.payment_status !== "paid") {
    throw new ExpressError("Checkout payment is not completed yet", 400);
  }

  const subscription = session.subscription;

  if (!subscription) {
    throw new ExpressError("Stripe subscription was not created", 400);
  }

  await syncSubscriptionToUser(subscription);

  const user = await User.findById(userId);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        user,
        sessionStatus: session.status,
        paymentStatus: session.payment_status,
      },
      "Checkout session verified successfully",
    ),
  );
});

const syncSubscriptionToUser = async (subscription) => {
  const { userId, planType, credits } = subscription.metadata || {};

  if (!userId || !planType) return;

  const activeStatuses = ["trialing", "active"];
  const isActive = activeStatuses.includes(subscription.status);

  await User.findByIdAndUpdate(userId, {
    plan: isActive ? planType : "free",
    credits: isActive
      ? Number(credits || STRIPE_PLANS[planType]?.credits || 100)
      : 100,
    stripeCustomerId: subscription.customer,
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: subscription.status,
    currentPeriodEnd: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null,
  });
};

export const stripeWebhook = async (req, res, next) => {
  const signature = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return next(
      new ExpressError("STRIPE_WEBHOOK_SECRET is not configured", 500),
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (error) {
    return next(
      new ExpressError(
        `Stripe webhook signature failed: ${error.message}`,
        400,
      ),
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription,
        );
        await syncSubscriptionToUser(subscription);
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscriptionToUser(event.data.object);
        break;
      }
      default:
        break;
    }

    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};
