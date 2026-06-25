import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, HelpCircle, ArrowRight, Coins } from "lucide-react";
const pricingPlans = [
  {
    name: "Starter",
    price: { monthly: 0, yearly: 0 },
    description: "Perfect for exploring AI web generation capabilities.",
    features: [
      "100 Free AI Coins ", // Added coins
      "3 Active AI Projects",
      "Standard Prompt Engine Access",
      "Lume.ai Subdomain Hosting",
      "Basic Export (HTML/CSS)",
      "Community Support",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Pro Professional",
    price: { monthly: 29, yearly: 24 },
    description: "For creators and freelancers building high-end spaces.",
    features: [
      "500 AI Coins / mo", // Added coins
      "Unlimited AI Generations",
      "Advanced Premium Layouts",
      "Custom Domain Integration",
      "Full Full-Stack Source Code Export",
      "Priority AI Queue Syncing",
      "24/7 Dedicated Support",
    ],
    cta: "Upgrade to Pro",
    popular: true,
  },
  {
    name: "Agency Studio",
    price: { monthly: 79, yearly: 65 },
    description: "Designed for high-performance scale and custom control.",
    features: [
      "1,500 Premium AI Coins / mo", // Added coins
      "Everything in Pro Plan",
      "White-Label Previews (No Brand Tag)",
      "Team Collaboration Spaces",
      "Custom Fine-Tuned AI Models",
      "Dedicated Account Partner",
    ],
    cta: "Contact Studio",
    popular: false,
  },
];
// Background Floating Particles Data
const particles = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  size: Math.random() * 3 + 2,
  initialX: Math.random() * 100,
  initialY: Math.random() * 100,
  moveX: (Math.random() - 0.5) * 50,
  moveY: (Math.random() - 0.5) * 50,
  duration: Math.random() * 8 + 12,
}));

const Price = () => {
  const [billingPeriod, setBillingPeriod] = useState("monthly");

  return (
    <div className="min-h-screen bg-[#f7f7f8] dark:bg-[#030303] text-zinc-900 dark:text-white px-6 py-20 relative overflow-hidden transition-colors duration-500">
      {/* ─── INTERACTIVE FLOATING PARTICLES (ADAPTIVE OPACITY) ─── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-40">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-purple-600 dark:bg-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.initialX}%`,
              top: `${p.initialY}%`,
            }}
            animate={{
              x: [0, p.moveX, 0],
              y: [0, p.moveY, 0],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* ─── PREMIUM ADAPTIVE GEOMETRIC AURA SHAPES ─── */}
      <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[850px] h-[850px] pointer-events-none select-none">
        {/* Fine Ambient Grid Ring */}
        <div className="absolute inset-0 rounded-full border border-zinc-300/60 dark:border-zinc-800/40 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_100%)]" />

        {/* Core Dual-Theme Aura Light (Soft Clean Pink/Purple Blur in Light Mode) */}
        <motion.div
          animate={{ scale: [1, 1.06, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-[15%] rounded-full bg-gradient-to-tr from-purple-400/20 via-fuchsia-300/20 dark:from-purple-600/15 dark:via-fuchsia-500/10 to-transparent blur-[100px]"
        />

        {/* Sharp Central Glassmorphic Mesh Ring */}
        <div className="absolute inset-[32%] rounded-full border border-purple-300/40 dark:border-purple-500/15 bg-white/30 dark:bg-zinc-950/20 backdrop-blur-[6px]" />
      </div>

      {/* Bottom Subtle Ambient Glow */}
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-400/10 dark:bg-blue-500/5 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Heading Section */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-zinc-300/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/40 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400 mb-6 shadow-sm shadow-zinc-200/50 dark:shadow-none"
          >
            <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            <span>Transparent Tiering</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-5xl font-black tracking-tight mb-4 text-zinc-900 dark:text-white"
          >
            Flexible Plans for{" "}
            <span className="bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 dark:from-purple-400 dark:via-fuchsia-400 dark:to-pink-500 bg-clip-text text-transparent italic px-1 font-serif">
              Every Scale
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-zinc-500 dark:text-zinc-400 text-sm max-w-lg mx-auto font-medium"
          >
            Choose the workspace capability you need. Switch or cancel your
            subscription at any interval smoothly.
          </motion.p>

          {/* Toggle Controls */}
          <div className="mt-10 flex justify-center">
            <div className="p-1 rounded-full border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950/60 backdrop-blur-xl flex items-center relative h-10 w-[184px] shadow-sm">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`relative z-10 w-1/2 text-center text-xs font-bold tracking-wide transition-all duration-300 cursor-pointer ${
                  billingPeriod === "monthly"
                    ? "text-white dark:text-black"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={`relative z-10 w-1/2 text-center text-xs font-bold tracking-wide transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 ${
                  billingPeriod === "yearly"
                    ? "text-white dark:text-black"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400"
                }`}
              >
                Yearly
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-black transition-colors ${
                    billingPeriod === "yearly"
                      ? "bg-white/20 dark:bg-black/10 text-white dark:text-black"
                      : "bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400"
                  }`}
                >
                  -20%
                </span>
              </button>

              <motion.div
                className="absolute top-1 bottom-1 bg-zinc-950 dark:bg-white rounded-full shadow-sm"
                animate={{
                  left: billingPeriod === "monthly" ? "4px" : "92px",
                  width: "88px",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6 items-start max-w-5xl mx-auto relative z-20">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: index * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ y: -8 }}
              className={`relative rounded-[2rem] p-7 border transition-all duration-500 backdrop-blur-md flex flex-col h-full ${
                plan.popular
                  ? "border-purple-500 bg-white dark:bg-gradient-to-b dark:from-zinc-950/95 dark:via-zinc-950/70 dark:to-purple-950/5 shadow-[0_25px_50px_-20px_rgba(168,85,247,0.15)] dark:shadow-[0_25px_60px_-25px_rgba(168,85,247,0.25)]"
                  : "border-zinc-200 dark:border-zinc-900 bg-white/70 dark:bg-zinc-950/40 hover:border-zinc-400 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-950/60 shadow-sm shadow-zinc-100 dark:shadow-none"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-0.5 bg-gradient-to-r from-purple-600 to-fuchsia-500 dark:from-purple-500 dark:to-fuchsia-500 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-md">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight mb-2">
                  {plan.name}
                </h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 min-h-[32px] leading-relaxed font-medium">
                  {plan.description}
                </p>

                {/* Price Display */}
                <div className="mt-5 flex items-baseline">
                  <span className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white font-mono">
                    $
                    {billingPeriod === "monthly"
                      ? plan.price.monthly
                      : plan.price.yearly}
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 font-bold ml-2">
                    / month
                  </span>
                </div>
                {billingPeriod === "yearly" && plan.price.yearly > 0 && (
                  <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold mt-1.5 tracking-wide">
                    Billed annually (${plan.price.yearly * 12}/yr)
                  </p>
                )}
              </div>

              {/* Action Button */}
              <button
                className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer border ${
                  plan.popular
                    ? "bg-zinc-950 dark:bg-white text-white dark:text-black border-zinc-950 dark:border-white hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-sm"
                    : "bg-purple-600 text-white border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                }`}
              >
                <span>{plan.cta}</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>

              <hr className="border-zinc-100 dark:border-zinc-900/60 my-6" />

              {/* Features List */}
              <ul className="space-y-3.5 flex-grow">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-xs text-zinc-700 dark:text-zinc-300 font-medium"
                  >
                    <div
                      className={`mt-0.5 p-0.5 rounded-full border flex items-center justify-center shrink-0 ${
                        feature.toLowerCase().includes("coin")
                          ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20"
                          : "bg-zinc-100 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800/60"
                      }`}
                    >
                      {feature.toLowerCase().includes("coin") ? (
                        <Coins className="w-3 h-3 text-amber-500 dark:text-amber-400 stroke-[2.5]" />
                      ) : (
                        <Check className="w-3 h-3 text-purple-600 dark:text-purple-400 stroke-[3]" />
                      )}
                    </div>
                    <span className="leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Minimal Support Line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-zinc-400 dark:text-zinc-600 mt-20 flex items-center justify-center gap-1.5 relative z-20"
        >
          <HelpCircle className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
          Have custom Enterprise volume requests?{" "}
          <span className="text-zinc-600 dark:text-zinc-400 underline cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors">
            Talk to our architecture engineering group.
          </span>
        </motion.p>
      </div>
    </div>
  );
};

export default Price;
