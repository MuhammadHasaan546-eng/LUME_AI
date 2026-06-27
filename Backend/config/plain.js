export const PLAN = {
  FREE: "free",
  PREMIUM: "premium",
  ENTERPRISE: "enterprise",
};

export const STRIPE_PLANS = {
  [PLAN.FREE]: {
    name: "Starter",
    credits: 100, // Number format for easy DB manipulation
    prices: {
      monthly: {
        priceId: "", // Stripe Dashboard ki product price ID yahan aayegi (e.g., price_1H... or free_tier)
        amount: 0,
      },
      yearly: {
        priceId: "",
        amount: 0,
      },
    },
  },
  [PLAN.PREMIUM]: {
    name: "Pro Professional",
    credits: 500,
    prices: {
      monthly: {
        priceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || "", // Stripe Dashboard price ID
        amount: 2900, // Stripe values cents me leta hai ($29 = 2900 cents)
      },
      yearly: {
        priceId: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || "",
        amount: 2400, // $24/mo billed annually
      },
    },
  },
  [PLAN.ENTERPRISE]: {
    name: "Agency Studio",
    credits: 1500,
    prices: {
      monthly: {
        priceId: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || "",
        amount: 7900, // $79 = 7900 cents
      },
      yearly: {
        priceId: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || "",
        amount: 6500, // $65/mo billed annually
      },
    },
  },
};

// Features schema validation reference or webhook checks
export const FEATURE = {
  [PLAN.FREE]: [
    "3 Active AI Projects",
    "Standard Prompt Engine Access",
    "Lume.ai Subdomain Hosting",
    "Basic Export (HTML/HTML/CSS)",
    "Community Support",
  ],
  [PLAN.PREMIUM]: [
    "Unlimited AI Generations",
    "Advanced Premium Layouts",
    "Custom Domain Integration",
    "Full Full-Stack Source Code Export",
    "Priority AI Queue Syncing",
    "24/7 Dedicated Support",
  ],
  [PLAN.ENTERPRISE]: [
    "Everything in Pro Plan",
    "White-Label Previews (No Brand Tag)",
    "Team Collaboration Spaces",
    "Custom Fine-Tuned AI Models",
    "Dedicated Account Partner",
  ],
};
