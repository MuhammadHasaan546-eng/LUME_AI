import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* ----------------------------------------------------------------
   Marquee Row — continuous infinite loop using duplicated content.
   Pauses on hover for readability.
----------------------------------------------------------------- */
const MarqueeRow = ({ items, direction = "left", speed = 40 }) => (
  <div className="group/marquee relative flex overflow-hidden">
    <div
      className={cn(
        "flex shrink-0 items-center gap-4 pr-4",
        "animate-[marquee_var(--marquee-duration)_linear_infinite] group-hover/marquee:[animation-play-state:paused]",
        direction === "right" && "[animation-direction:reverse]",
      )}
      style={{ "--marquee-duration": `${speed}s` }}
    >
      {items.map((item, i) => (
        <MarqueeCard key={`a-${i}`} {...item} />
      ))}
    </div>
    <div
      aria-hidden
      className={cn(
        "flex shrink-0 items-center gap-4 pr-4",
        "animate-[marquee_var(--marquee-duration)_linear_infinite] group-hover/marquee:[animation-play-state:paused]",
        direction === "right" && "[animation-direction:reverse]",
      )}
      style={{ "--marquee-duration": `${speed}s` }}
    >
      {items.map((item, i) => (
        <MarqueeCard key={`b-${i}`} {...item} />
      ))}
    </div>
  </div>
);

const MarqueeCard = ({ name, role, avatar, text, rating }) => (
  <figure className="group/card relative w-[340px] shrink-0 rounded-3xl border border-primary/10 bg-card/60 backdrop-blur-md p-6 transition-all duration-500 hover:border-primary/30 hover:-translate-y-1">
    {/* Glow on hover */}
    <div className="pointer-events-none absolute -inset-px rounded-[inherit] bg-gradient-to-br from-primary/10 to-purple-500/10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <Quote className="h-6 w-6 text-primary/30" />
        <div className="flex gap-0.5">
          {Array.from({ length: rating }).map((_, i) => (
            <Star
              key={i}
              className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400"
            />
          ))}
        </div>
      </div>
      <blockquote className="text-sm text-muted-foreground leading-relaxed mb-5 line-clamp-3">
        "{text}"
      </blockquote>
      <figcaption className="flex items-center gap-3">
        <img
          src={avatar}
          alt={name}
          loading="lazy"
          className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/10 group-hover/card:ring-primary/40 transition-all"
        />
        <div>
          <div className="text-sm font-semibold">{name}</div>
          <div className="text-xs text-muted-foreground">{role}</div>
        </div>
      </figcaption>
    </div>
  </figure>
);

/* ----------------------------------------------------------------
   Featured Testimonial Slider — manual + auto-advance with
   AnimatePresence crossfade/slide micro-interactions.
----------------------------------------------------------------- */
const featured = [
  {
    name: "Sarah Chen",
    role: "Founder, Nova Labs",
    avatar: "https://i.pravatar.cc/120?img=47",
    text: "Lume replaced our entire design sprint. We shipped a polished marketing site in an afternoon — the AI understood our brand voice on the first try.",
    rating: 5,
  },
  {
    name: "Marcus Reid",
    role: "CTO, Driftwood Studio",
    avatar: "https://i.pravatar.cc/120?img=12",
    text: "The edge hosting is unreal. Our Lighthouse scores went from 60s to perfect 100s without touching a single line of config.",
    rating: 5,
  },
  {
    name: "Aisha Patel",
    role: "Indie Maker",
    avatar: "https://i.pravatar.cc/120?img=32",
    text: "I described my coffee shop in one sentence and got a fully responsive, SEO-ready site. This is the future of building on the web.",
    rating: 5,
  },
];

const marqueeItems = [
  {
    name: "Elena Voss",
    role: "Designer",
    avatar: "https://i.pravatar.cc/80?img=5",
    text: "The animations feel hand-crafted, not generated.",
    rating: 5,
  },
  {
    name: "Tom Becker",
    role: "Developer",
    avatar: "https://i.pravatar.cc/80?img=15",
    text: "Best DX I've had with any site builder, period.",
    rating: 5,
  },
  {
    name: "Lina Park",
    role: "PM, Flow",
    avatar: "https://i.pravatar.cc/80?img=25",
    text: "We cut our landing-page time-to-launch by 90%.",
    rating: 5,
  },
  {
    name: "Diego Santos",
    role: "Founder",
    avatar: "https://i.pravatar.cc/80?img=8",
    text: "The AI actually understands layout hierarchy.",
    rating: 5,
  },
  {
    name: "Mia Wong",
    role: "Marketer",
    avatar: "https://i.pravatar.cc/80?img=20",
    text: "Conversion went up 2x after switching to Lume.",
    rating: 5,
  },
  {
    name: "Omar Faruk",
    role: "Engineer",
    avatar: "https://i.pravatar.cc/80?img=33",
    text: "Edge delivery is genuinely instant worldwide.",
    rating: 5,
  },
];

const logos = [
  "NOVA",
  "DRIFT",
  "FLOW",
  "PULSE",
  "ORBIT",
  "VERTEX",
  "LUMEN",
  "APEX",
];

const TestimonialSlider = () => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const paginate = (dir) => {
    setDirection(dir);
    setIndex((prev) => (prev + dir + featured.length) % featured.length);
  };

  // Auto-advance
  React.useEffect(() => {
    const id = setInterval(() => paginate(1), 6000);
    return () => clearInterval(id);
  }, []);

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0, scale: 0.96 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir) => ({ x: dir > 0 ? -80 : 80, opacity: 0, scale: 0.96 }),
  };

  const active = featured[index];

  return (
    <section className="relative py-32 px-6 bg-background overflow-hidden">
      {/* Ambient glow */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.05, 0.12, 0.05] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 blur-[150px] -z-10 rounded-full"
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
            Loved by builders
          </h2>
          <p className="text-muted-foreground">
            Thousands of teams ship faster with Lume.
          </p>
        </motion.div>

        {/* Featured slider */}
        <div className="relative max-w-3xl mx-auto mb-20">
          <div className="relative min-h-[260px] md:min-h-[220px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.figure
                key={index}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute inset-0 rounded-[2rem] border border-primary/10 bg-card/60 backdrop-blur-md p-8 md:p-10"
              >
                <Quote className="h-10 w-10 text-primary/20 mb-4" />
                <blockquote className="text-lg md:text-2xl font-medium leading-relaxed mb-6">
                  "{active.text}"
                </blockquote>
                <figcaption className="flex items-center gap-4">
                  <img
                    src={active.avatar}
                    alt={active.name}
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20"
                  />
                  <div>
                    <div className="font-semibold">{active.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {active.role}
                    </div>
                  </div>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => paginate(-1)}
              aria-label="Previous testimonial"
              className="p-3 rounded-full border border-primary/10 bg-card/50 hover:bg-primary/10 hover:scale-110 active:scale-95 transition-all"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex gap-2">
              {featured.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDirection(i > index ? 1 : -1);
                    setIndex(i);
                  }}
                  aria-label={`Go to testimonial ${i + 1}`}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    i === index
                      ? "w-8 bg-primary"
                      : "w-2 bg-primary/20 hover:bg-primary/40",
                  )}
                />
              ))}
            </div>
            <button
              onClick={() => paginate(1)}
              aria-label="Next testimonial"
              className="p-3 rounded-full border border-primary/10 bg-card/50 hover:bg-primary/10 hover:scale-110 active:scale-95 transition-all"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Continuous marquee walls */}
        <div className="space-y-4 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <MarqueeRow items={marqueeItems} direction="left" speed={45} />
          <MarqueeRow
            items={[...marqueeItems].reverse()}
            direction="right"
            speed={55}
          />
        </div>

        {/* Logo wall */}
        <div className="mt-20 pt-12 border-t border-primary/5">
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-8">
            Trusted by teams at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {logos.map((logo) => (
              <motion.span
                key={logo}
                initial={{ opacity: 0.3 }}
                whileHover={{ opacity: 1, scale: 1.1, y: -2 }}
                transition={{ duration: 0.3 }}
                className="text-2xl font-black tracking-tighter text-muted-foreground/40 hover:text-foreground cursor-default"
              >
                {logo}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSlider;
