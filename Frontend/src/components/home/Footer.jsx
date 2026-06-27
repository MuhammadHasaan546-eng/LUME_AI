import React from "react";
import { motion } from "framer-motion"; // Agar error de toh "motion/react" use karein
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Globe, MessageCircle, Briefcase, Mail } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: Globe, to: "/" },
    { icon: MessageCircle, to: "/" },
    { icon: Briefcase, to: "/" },
    { icon: Mail, to: "/" },
  ];

  const footerLinks = [
    {
      title: "Product",
      links: [
        { name: "Features", to: "/features" },
        { name: "Showcase", to: "/showcase" },
        { name: "Pricing", to: "/pricing" },
        { name: "Releases", to: "/" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About", to: "/" },
        { name: "Careers", to: "/" },
        { name: "Contact", to: "/" },
        { name: "Privacy", to: "/" },
      ],
    },
    {
      title: "Resources",
      links: [
        { name: "Documentation", to: "/docs" },
        { name: "Help Center", to: "/" },
        { name: "Community", to: "/" },
        { name: "API Reference", to: "/" },
      ],
    },
  ];

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <footer className="relative border-t border-primary/10 bg-background pt-20 pb-10 overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 blur-[120px] -z-10 rounded-full" />

      <motion.div
        className="container mx-auto px-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand Section */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-2 space-y-6"
          >
            <div className="flex items-center gap-2 group cursor-pointer w-fit">
              <div className="bg-primary p-1 rounded-lg shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tighter uppercase">
                LUME<span className="text-primary">.AI</span>
              </span>
            </div>
            <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
              The next generation of web building. Powered by AI, designed for
              humans. Create, launch, and scale in seconds.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Link
                    to={social.to}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-primary/10 hover:text-primary transition-all border border-primary/5"
                  >
                    <social.icon className="h-4 w-4" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Links Sections */}
          {footerLinks.map((section) => (
            <motion.div
              key={section.title}
              variants={itemVariants}
              className="space-y-4"
            >
              <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <motion.div whileHover={{ x: 5 }}>
                      <Link
                        to={link.to}
                        className="inline-block text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        {link.name}
                      </Link>
                    </motion.div>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}

          {/* Newsletter Section */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-1 space-y-4"
          >
            <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">
              Stay Updated
            </h4>
            <div className="flex flex-col gap-3">
              <Input
                placeholder="Email address"
                className="bg-secondary/30 border-primary/10 focus-visible:ring-primary/20"
              />
              <Button
                size="sm"
                className="w-full font-bold shadow-lg shadow-primary/20"
              >
                Subscribe
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          variants={itemVariants}
          className="pt-8 border-t border-primary/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground"
        >
          <p>© {currentYear} Lume AI Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link to="/" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/" className="hover:text-primary transition-colors">
              Cookies
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </footer>
  );
};

export default Footer;
