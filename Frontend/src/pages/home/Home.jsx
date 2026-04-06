import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  Zap,
  Layout,
  Globe,
  ArrowRight,
  Cpu,
  MousePointer2,
  Wand2,
} from "lucide-react";

const Home = () => {
  // --- Typewriter Effect Logic ---
  const [placeholder, setPlaceholder] = useState("");
  const phrases = [
    "A luxury watch store with dark aesthetics...",
    "A professional portfolio for a developer...",
    "A minimalist SaaS landing page...",
    "A modern coffee shop website...",
  ];

  useEffect(() => {
    let currentPhraseIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    let typingTimeout;

    const type = () => {
      const currentPhrase = phrases[currentPhraseIndex];

      if (isDeleting) {
        setPlaceholder(currentPhrase.substring(0, currentCharIndex - 1));
        currentCharIndex--;
      } else {
        setPlaceholder(currentPhrase.substring(0, currentCharIndex + 1));
        currentCharIndex++;
      }

      let speed = isDeleting ? 50 : 100;

      if (!isDeleting && currentCharIndex === currentPhrase.length) {
        speed = 2000; // Pause at end
        isDeleting = true;
      } else if (isDeleting && currentCharIndex === 0) {
        isDeleting = false;
        currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
        speed = 500;
      }

      typingTimeout = setTimeout(type, speed);
    };

    type();
    return () => clearTimeout(typingTimeout);
  }, []);

  // --- Animation Variants ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="flex flex-col min-h-screen overflow-hidden bg-background">
      {/* --- HERO SECTION --- */}
      <section className="relative pt-24 pb-32 px-6">
        {/* Futuristic Background Effects */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 blur-[120px] -z-20 rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 blur-[120px] -z-20 rounded-full animate-pulse delay-700" />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="container mx-auto text-center max-w-4xl"
        >
          <motion.div variants={itemVariants}>
            <Badge
              variant="outline"
              className="mb-8 py-1.5 px-4 border-primary/20 bg-primary/5 text-primary text-xs font-bold rounded-full tracking-widest uppercase"
            >
              <Sparkles className="mr-2 h-3.5 w-3.5" /> Lume AI Engine v1.0
            </Badge>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]"
          >
            Build the future <br />
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent italic">
              with a Prompt.
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Lume is the first AI-native website builder designed for
            high-performance scale. Describe it, and watch the magic happen in
            real-time.
          </motion.p>

          {/* AI Prompt Input Bar */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col md:flex-row items-center gap-3 p-2 bg-card/50 backdrop-blur-xl border border-primary/10 rounded-2xl shadow-[0_0_50px_-12px_rgba(var(--primary),0.3)] max-w-2xl mx-auto ring-offset-background focus-within:ring-2 focus-within:ring-primary/30 transition-all"
          >
            <Input
              placeholder={placeholder}
              className="border-none bg-transparent text-lg focus-visible:ring-0 shadow-none h-14"
            />
            <Button
              size="lg"
              className="w-full md:w-auto px-10 h-14 rounded-xl font-black bg-primary hover:shadow-[0_0_20px_rgba(var(--primary),0.5)] transition-all"
            >
              Generate <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>

          {/* Floating Preview Mockup */}
          <motion.div
            variants={itemVariants}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="mt-24 relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-purple-600/50 rounded-2xl blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative rounded-2xl border border-primary/10 bg-card/80 backdrop-blur-md overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop"
                alt="AI Preview"
                className="w-full opacity-80 group-hover:opacity-100 transition-opacity duration-500"
              />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* --- PROCESS SECTION --- */}
      <section className="py-24 px-6 border-y border-primary/5 bg-secondary/10">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: <Wand2 className="h-8 w-8" />,
                title: "Describe",
                desc: "Just type what you need. AI handles the rest.",
              },
              {
                icon: <Cpu className="h-8 w-8" />,
                title: "Think",
                desc: "Lume generates layouts, code, and SEO copy.",
              },
              {
                icon: <MousePointer2 className="h-8 w-8" />,
                title: "Launch",
                desc: "Click deploy and your site is live instantly.",
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="p-8 rounded-3xl border border-primary/5 bg-background/50 hover:bg-background transition-all group"
              >
                <div className="mb-6 text-primary p-3 bg-primary/10 w-fit rounded-2xl group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="py-32 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black tracking-tighter mb-4 uppercase">
              Hyper-Performance
            </h2>
            <p className="text-muted-foreground">
              The most advanced AI engine for the modern web.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap className="text-yellow-500" />,
                title: "Instant Generation",
                desc: "Live website in under 30 seconds.",
              },
              {
                icon: <Layout className="text-blue-500" />,
                title: "Adaptive Design",
                desc: "Perfect on every screen size.",
              },
              {
                icon: <Globe className="text-green-500" />,
                title: "Edge Hosting",
                desc: "Lightning fast global delivery.",
              },
            ].map((feature, i) => (
              <Card
                key={i}
                className="bg-card/50 border-primary/5 hover:border-primary/20 transition-all"
              >
                <CardContent className="pt-8">
                  <div className="mb-4 bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="relative rounded-[2rem] overflow-hidden bg-primary px-8 py-20 text-center text-primary-foreground shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15),transparent)] animate-pulse" />
            <h2 className="relative text-4xl md:text-6xl font-black tracking-tighter mb-8 uppercase">
              Ready to build the future?
            </h2>
            <Button
              size="lg"
              variant="secondary"
              className="relative h-16 px-12 text-xl font-black rounded-2xl hover:scale-105 transition-transform shadow-xl"
            >
              Start Building Now
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
