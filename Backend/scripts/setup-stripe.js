import dotenv from "dotenv";
dotenv.config();
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_API_SECRET_KEY;

if (!stripeSecretKey) {
  console.error(
    "❌ STRIPE_API_SECRET_KEY is missing in Backend/.env. Add it before running this script.",
  );
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey);

/**
 * Plans configuration — mirrors Backend/config/plain.js
 * Amounts are in cents (Stripe's smallest currency unit).
 */
const PLANS = [
  {
    key: "PREMIUM",
    name: "Pro Professional",
    description: "For creators and freelancers building high-end spaces.",
    monthlyAmount: 2900, // $29.00
    yearlyAmount: 28800, // $24.00/mo × 12 = $288.00/yr
  },
  {
    key: "ENTERPRISE",
    name: "Agency Studio",
    description: "Designed for high-performance scale and custom control.",
    monthlyAmount: 7900, // $79.00
    yearlyAmount: 78000, // $65.00/mo × 12 = $780.00/yr
  },
];

const envLines = [];

const createOrReuseProduct = async (name, description) => {
  // Search for an existing product to keep the script idempotent.
  const existing = await stripe.products.search({
    query: `name:'${name}'`,
  });

  if (existing.data.length > 0) {
    console.log(
      `♻️  Reusing existing product: ${name} (${existing.data[0].id})`,
    );
    return existing.data[0];
  }

  const product = await stripe.products.create({
    name,
    description,
  });

  console.log(`✅ Created product: ${name} (${product.id})`);
  return product;
};

const createOrReusePrice = async (product, unitAmount, interval) => {
  const recurring = {
    interval,
    usage_type: "licensed",
  };

  // Search for an existing price for this product with the same amount/interval.
  const existing = await stripe.prices.list({
    product: product.id,
    active: true,
    type: "recurring",
  });

  const match = existing.data.find(
    (p) =>
      p.unit_amount === unitAmount &&
      p.recurring?.interval === interval &&
      p.currency === "usd",
  );

  if (match) {
    console.log(
      `♻️  Reusing existing ${interval} price for ${product.name}: ${match.id}`,
    );
    return match;
  }

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: unitAmount,
    currency: "usd",
    recurring,
  });

  console.log(
    `✅ Created ${interval} price for ${product.name}: ${price.id} ($${(unitAmount / 100).toFixed(2)})`,
  );
  return price;
};

const run = async () => {
  console.log("🚀 Starting Stripe product & price setup...\n");

  for (const plan of PLANS) {
    const product = await createOrReuseProduct(plan.name, plan.description);

    const monthlyPrice = await createOrReusePrice(
      product,
      plan.monthlyAmount,
      "month",
    );
    const yearlyPrice = await createOrReusePrice(
      product,
      plan.yearlyAmount,
      "year",
    );

    envLines.push(
      `STRIPE_${plan.key}_MONTHLY_PRICE_ID=${monthlyPrice.id}`,
      `STRIPE_${plan.key}_YEARLY_PRICE_ID=${yearlyPrice.id}`,
    );
  }

  console.log("\n──────────────────────────────────────────────");
  console.log("🎉 Setup complete! Add these to your Backend/.env:");
  console.log("──────────────────────────────────────────────\n");
  console.log(envLines.join("\n"));
  console.log("\n──────────────────────────────────────────────\n");
};

run().catch((error) => {
  console.error("\n❌ Stripe setup failed:");
  console.error(error.message);
  process.exit(1);
});
