import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { Zap, Globe, Users, Clock } from "lucide-react";

/**
 * AnimatedCounter
 * Smoothly counts from 0 to `value` once it scrolls into view.
 * Uses a spring for organic easing and respects decimals/suffixes.
 */
const AnimatedCounter = ({
  value,
  duration = 2,
  decimals = 0,
  suffix = "",
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, {
    duration: duration * 1000,
    bounce: 0,
  });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (inView) {
      motionValue.set(value);
    }
  }, [inView, value, motionValue]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      setDisplay(
        new Intl.NumberFormat("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(Number(latest.toFixed(decimals))),
      );
    });
    return () => unsubscribe();
  }, [spring, decimals]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
};

const stats = [
  {
    icon: Zap,
    value: 30,
    suffix: "s",
    label: "Avg. generation time",
    color: "text-yellow-500",
    glow: "from-yellow-500/20",
  },
  {
    icon: Globe,
    value: 120,
    suffix: "+",
    label: "Countries served",
    color: "text-green-500",
    glow: "from-green-500/20",
  },
  {
    icon: Users,
    value: 45,
    suffix: "K+",
    label: "Sites launched",
    color: "text-blue-500",
    glow: "from-blue-500/20",
  },
  {
    icon: Clock,
    value: 99.9,
    decimals: 1,
    suffix: "%",
    label: "Uptime guaranteed",
    color: "text-purple-500",
    glow: "from-purple-500/20",
  },
];

const StatsSection = () => {
  return (
    <section className="relative py-24 px-6 border-y border-primary/5 bg-secondary/10 overflow-hidden">
      {/* Ambient drifting glow */}
      <motion.div
        animate={{ x: [0, 60, 0], y: [0, -30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-1/4 left-1/3 w-[500px] h-[500px] bg-primary/10 blur-[140px] rounded-full -z-10"
      />

      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-black tracking-tighter mb-4 uppercase">
            Numbers that scale
          </h2>
          <p className="text-muted-foreground">
            Real performance, measured across the globe.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className="group relative p-8 rounded-3xl border border-primary/10 bg-card/50 backdrop-blur-sm overflow-hidden"
              >
                {/* Hover gradient wash */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${stat.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />
                <div className="relative z-10">
                  <div
                    className={`mb-5 inline-flex p-3 rounded-2xl bg-primary/10 ${stat.color} group-hover:scale-125 group-hover:rotate-6 transition-transform duration-500`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-4xl md:text-5xl font-black tracking-tighter mb-2">
                    <AnimatedCounter
                      value={stat.value}
                      decimals={stat.decimals}
                      suffix={stat.suffix}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
