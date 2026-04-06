import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./ModeToggle";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
} from "@/components/ui/sheet";
import { Menu, Sparkles } from "lucide-react";

const navItems = [
  { name: "Features", href: "#" },
  { name: "Showcase", href: "#" },
  { name: "Pricing", href: "#" },
  { name: "Docs", href: "#" },
];

const Header = () => {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 w-full border-b border-primary/10 bg-background/80 backdrop-blur-md"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        {/* Logo Section */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-2 group cursor-pointer"
        >
          <div className="bg-primary p-1.5 rounded-lg shadow-[0_0_20px_rgba(var(--primary),0.3)]">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tighter">
            LUME<span className="text-primary">.AI</span>
          </span>
        </motion.div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navItems.map((item, index) => (
            <motion.a
              key={item.name}
              href={item.href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
              className="text-muted-foreground transition-colors hover:text-primary relative group"
            >
              {item.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </motion.a>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Switcher - Always Visible */}
          <ModeToggle />

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" className="font-medium">
              Log in
            </Button>
            <Button
              size="sm"
              className="bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all font-semibold"
            >
              Start Building
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="border-l border-primary/10 bg-background/95 backdrop-blur-xl"
              >
                <SheetHeader>
                  <SheetTitle className="text-left flex items-center gap-2 pt-4">
                    <Sparkles className="h-5 w-5 text-primary" /> Lume AI
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 mt-10">
                  {navItems.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="text-xl font-semibold tracking-tight hover:text-primary transition-colors"
                    >
                      {item.name}
                    </a>
                  ))}
                  <div className="pt-4 flex flex-col gap-3">
                    <Button variant="outline" className="w-full">
                      Log in
                    </Button>
                    <Button className="w-full">Start Free Trial</Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
