import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   FAQ ACCORDION — ultra-smooth height animation via
   AnimatePresence + height: "auto" transition.
============================================================ */
const faqs = [
  {
    q: "How does the AI generation actually work?",
    a: "Describe your site in plain language and Lume's engine interprets intent, generates semantic layout, writes SEO copy, and assembles production-ready React — all in under 30 seconds. You can refine anything with follow-up prompts.",
  },
  {
    q: "Do I own the code I generate?",
    a: "Absolutely. Every site you build is yours — export the full source, host it anywhere, or deploy instantly on Lume's global edge network. No lock-in, ever.",
  },
  {
    q: "Can I edit the generated site manually?",
    a: "Yes. The built-in editor gives you full visual control alongside a live code view. Tweak layouts, swap components, or hand-edit the source — changes sync in real time.",
  },
  {
    q: "Is hosting included in every plan?",
    a: "Edge hosting is included on all paid plans with a 99.9% uptime guarantee. The free tier lets you preview and prototype as much as you like before deploying.",
  },
  {
    q: "What about responsive design and SEO?",
    a: "Every generated site is fully responsive out of the box and ships with structured data, meta tags, sitemaps, and Core Web Vitals optimizations tuned for top Lighthouse scores.",
  },
];

const FaqItem = ({ item, isOpen, onToggle, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.4, delay: index * 0.08 }}
    className={cn(
      "rounded-2xl border bg-card/50 backdrop-blur-sm overflow-hidden transition-colors duration-300",
      isOpen
        ? "border-primary/30"
        : "border-primary/10 hover:border-primary/20",
    )}
  >
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-4 p-6 text-left"
      aria-expanded={isOpen}
    >
      <span className="font-semibold text-base md:text-lg">{item.q}</span>
      <motion.span
        animate={{ rotate: isOpen ? 135 : 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "shrink-0 grid place-items-center h-8 w-8 rounded-full transition-colors",
          isOpen
            ? "bg-primary text-primary-foreground"
            : "bg-primary/10 text-primary",
        )}
      >
        <Plus className="h-4 w-4" />
      </motion.span>
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="content"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <p className="px-6 pb-6 text-sm md:text-base text-muted-foreground leading-relaxed">
            {item.a}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

const FaqAccordion = () => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="relative py-32 px-6 bg-secondary/10 border-y border-primary/5">
      <div className="container mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-4xl font-black tracking-tighter mb-4 uppercase">
            Questions, answered
          </h2>
          <p className="text-muted-foreground">
            Everything you need to know before you build.
          </p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((item, i) => (
            <FaqItem
              key={i}
              index={i}
              item={item}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export { FaqAccordion };
export default FaqAccordion;
