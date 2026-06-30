import React, { useRef, useState, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* ----------------------------------------------------------------
   Marquee Row — Clean Infinite CSS Loop (Never Stops)
----------------------------------------------------------------- */
const MarqueeRow = ({ items, direction = "left", speed = 40 }) => {
  return (
    <div className="group/marquee relative flex w-full overflow-hidden py-2">
      <div
        className={cn(
          "flex shrink-0 items-center gap-4 pr-4",
          "animate-marquee-loop group-hover/marquee:[animation-play-state:paused]",
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
          "animate-marquee-loop group-hover/marquee:[animation-play-state:paused]",
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
};

const MarqueeCard = ({ name, role, avatar, text, rating }) => (
  <figure className="group/card relative w-[340px] shrink-0 rounded-3xl border border-primary/10 bg-card/60 backdrop-blur-md p-6 transition-all duration-500 hover:border-primary/30 hover:-translate-y-1">
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
   Data Collections
----------------------------------------------------------------- */
const featured = [
  {
    name: "Sarah Chen",
    role: "Founder, Nova Labs",
    avatar:
      "https://ui-avatars.com/api/?name=Sarah+Chen&background=6d28d9&color=fff&size=120",
    text: "Lume replaced our entire design sprint. We shipped a polished marketing site in an afternoon — the AI understood our brand voice on the first try.",
    rating: 5,
  },
  {
    name: "Marcus Reid",
    role: "CTO, Driftwood Studio",
    avatar:
      "https://ui-avatars.com/api/?name=Marcus+Reid&background=2563eb&color=fff&size=120",
    text: "The edge hosting is unreal. Our Lighthouse scores went from 60s to perfect 100s without touching a single line of config.",
    rating: 5,
  },
  {
    name: "Aisha Patel",
    role: "Indie Maker",
    avatar:
      "https://ui-avatars.com/api/?name=Aisha+Patel&background=7c3aed&color=fff&size=120",
    text: "I described my coffee shop in one sentence and got a fully responsive, SEO-ready site. This is the future of building on the web.",
    rating: 5,
  },
];

const marqueeItems = [
  {
    name: "Elena Voss",
    role: "Designer",
    avatar:
      "https://ui-avatars.com/api/?name=Elena+Voss&background=9333ea&color=fff&size=80",
    text: "The animations feel hand-crafted, not generated.",
    rating: 5,
  },
  {
    name: "Tom Becker",
    role: "Developer",
    avatar:
      "https://ui-avatars.com/api/?name=Tom+Becker&background=3b82f6&color=fff&size=80",
    text: "Best DX I've had with any site builder, period.",
    rating: 5,
  },
  {
    name: "Lina Park",
    role: "PM, Flow",
    avatar:
      "https://ui-avatars.com/api/?name=Lina+Park&background=6d28d9&color=fff&size=80",
    text: "We cut our landing-page time-to-launch by 90%.",
    rating: 5,
  },
  {
    name: "Diego Santos",
    role: "Founder",
    avatar:
      "https://ui-avatars.com/api/?name=Diego+Santos&background=1d4ed8&color=fff&size=80",
    text: "The AI actually understands layout hierarchy.",
    rating: 5,
  },
  {
    name: "Mia Wong",
    role: "Marketer",
    avatar:
      "https://ui-avatars.com/api/?name=Mia+Wong&background=7c3aed&color=fff&size=80",
    text: "Conversion went up 2x after switching to Lume.",
    rating: 5,
  },
  {
    name: "Omar Faruk",
    role: "Engineer",
    avatar:
      "https://ui-avatars.com/api/?name=Omar+Faruk&background=4f46e5&color=fff&size=80",
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

/* ----------------------------------------------------------------
   Main Component
----------------------------------------------------------------- */
const TestimonialSlider = () => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const sectionRef = useRef(null);

  // 1. Scroll Hook
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // 2. Pure Scroll Parallax Offset (बिना ऑटो-ड्रिफ्ट टकराव के)
  // जब यूजर स्क्रॉल करेगा तो रो थोड़ा सा शिफ्ट होगी, स्क्रॉल रुकने पर शिफ्ट रुक जाएगा पर मारकी चलती रहेगी।
  const rowOneX = useTransform(scrollYProgress, [0, 1], [150, -150]);
  const rowTwoX = useTransform(scrollYProgress, [0, 1], [-150, 150]);

  const marqueeOpacity = useTransform(
    scrollYProgress,
    [0, 0.15, 0.85, 1],
    [0, 1, 1, 0],
  );
  const featuredY = useTransform(scrollYProgress, [0, 1], [30, -30]);

  const paginate = (dir) => {
    setDirection(dir);
    setIndex((prev) => (prev + dir + featured.length) % featured.length);
  };

  useEffect(() => {
    const id = setInterval(() => paginate(1), 6000);
    return () => clearInterval(id);
  }, [index]);

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0, scale: 0.97 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0, scale: 0.97 }),
  };

  return (
    <section
      ref={sectionRef}
      className="relative py-32 px-6 bg-background overflow-hidden"
    >
      {/* Premium Glow */}
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.04, 0.1, 0.04] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 blur-[130px] -z-10 rounded-full"
      />

      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl font-black tracking-tighter mb-4 uppercase">
            Loved by builders
          </h2>
          <p className="text-muted-foreground">
            Thousands of teams ship faster with Lume.
          </p>
        </motion.div>

        {/* Featured Slider */}
        <motion.div
          style={{ y: featuredY }}
          className="relative max-w-3xl mx-auto mb-28"
        >
          <div className="relative min-h-[260px] sm:min-h-[220px] md:min-h-[180px] w-full">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.figure
                key={index}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute inset-0 w-full h-full rounded-[2rem] border border-primary/10 bg-card/60 backdrop-blur-md p-8 md:p-10 flex flex-col justify-between"
              >
                <div>
                  <Quote className="h-9 w-9 text-primary/20 mb-3" />
                  <blockquote className="text-lg md:text-xl font-medium leading-relaxed mb-6">
                    "{featured[index].text}"
                  </blockquote>
                </div>
                <figcaption className="flex items-center gap-4 mt-auto">
                  <img
                    src={featured[index].avatar}
                    alt={featured[index].name}
                    className="h-11 w-11 rounded-full object-cover ring-2 ring-primary/20"
                  />
                  <div>
                    <div className="font-semibold text-sm">
                      {featured[index].name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {featured[index].role}
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
              className="p-3 rounded-full border border-primary/10 bg-card/50 hover:bg-primary/10 hover:scale-110 active:scale-95 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex gap-2">
              {featured.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDirection(i > index ? 1 : -1);
                    setIndex(i);
                  }}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === index
                      ? "w-7 bg-primary"
                      : "w-1.5 bg-primary/20 hover:bg-primary/40",
                  )}
                />
              ))}
            </div>
            <button
              onClick={() => paginate(1)}
              className="p-3 rounded-full border border-primary/10 bg-card/50 hover:bg-primary/10 hover:scale-110 active:scale-95 transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        {/* Non-Blocking Smooth Parallax Marquee Wall */}
        <motion.div
          style={{ opacity: marqueeOpacity }}
          className="space-y-6 [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)] overflow-visible"
        >
          {/* Row 1 */}
          <motion.div style={{ x: rowOneX }}>
            <MarqueeRow items={marqueeItems} direction="left" speed={45} />
          </motion.div>

          {/* Row 2 */}
          <motion.div style={{ x: rowTwoX }}>
            <MarqueeRow
              items={[...marqueeItems].reverse()}
              direction="right"
              speed={55}
            />
          </motion.div>
        </motion.div>

        {/* Logo Section */}
        <div className="mt-24 pt-12 border-t border-primary/5">
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground/60 mb-8">
            Trusted by teams at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {logos.map((logo) => (
              <motion.span
                key={logo}
                initial={{ opacity: 0.25 }}
                whileHover={{ opacity: 0.9, scale: 1.08, y: -2 }}
                transition={{ duration: 0.2 }}
                className="text-xl font-black tracking-tighter text-muted-foreground/40 hover:text-foreground cursor-default uppercase"
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
