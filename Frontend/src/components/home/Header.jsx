import React from "react";
import { motion } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
// import { logout } from "@/store/authSlice"; // Apne slice ke mutabiq uncomment karein

// UI Components
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./ModeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LoginModal from "../Auth/LoginModal";

// Shadcn Dropdown Menu
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Shadcn Sheet (Mobile Menu)
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
} from "@/components/ui/sheet";

// Icons
import {
  Menu,
  Sparkles,
  LogOut,
  LayoutDashboard,
  User,
  Mail,
  Coins,
} from "lucide-react";

const navItems = [
  { name: "Features", href: "#" },
  { name: "Showcase", href: "#" },
  { name: "Pricing", href: "#" },
  { name: "Docs", href: "#" },
];

const Header = () => {
  const dispatch = useDispatch();

  // Redux state
  const userData = useSelector((state) => state.auth.user);

  // Initials generator safely handles empty or pending names
  const getUserInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    // dispatch(logout());
    console.log("Logged out successfully");
  };

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
          <ModeToggle />

          {/* Desktop Control Panel */}
          <div className="hidden md:flex items-center gap-4">
            {!userData ? (
              <>
                <LoginModal>
                  <Button variant="ghost">Log in</Button>
                </LoginModal>
                <LoginModal>
                  <Button className="bg-primary shadow-[0_0_15px_rgba(var(--primary),0.2)] hover:shadow-[0_0_25px_rgba(var(--primary),0.4)] transition-all">
                    Start Building
                  </Button>
                </LoginModal>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Button variant="ghost" className="gap-2 text-sm font-medium">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Button>

                {/* Desktop Dropdown with User Info */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="focus:outline-none outline-none ring-0">
                    <Avatar className="h-9 w-9 border border-primary/20 shadow-md cursor-pointer hover:opacity-80 transition-opacity">
                      <AvatarImage
                        src={userData?.avatar}
                        alt={userData?.name || "User"}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                        {getUserInitials(userData?.name)}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    className="w-56 border-primary/10 bg-background/95 backdrop-blur-xl shadow-xl mt-2 p-1.5 rounded-xl"
                  >
                    {/* User Profile Header */}
                    <DropdownMenuLabel className="font-normal p-2">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-bold leading-none text-foreground flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-primary" />{" "}
                          {userData?.name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground flex items-center gap-1.5 truncate">
                          <Mail className="h-3 w-3" /> {userData?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator className="bg-primary/10" />

                    {/* Plan & Credits Section (Sleek UI Badges) */}
                    <div className="p-2 flex flex-col gap-1.5 bg-primary/5 rounded-lg mx-1 my-1 border border-primary/5">
                      {userData?.plan && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-medium">
                            Plan
                          </span>
                          <span className="font-black text-primary uppercase tracking-wider text-[10px] bg-primary/10 px-2 py-0.5 rounded-full">
                            {userData.plan}
                          </span>
                        </div>
                      )}

                      {/* Credits Display */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">
                          Credits
                        </span>
                        <span className="font-bold text-foreground flex items-center gap-1">
                          <Coins className="h-3 w-3 text-amber-500 fill-amber-500/20" />
                          {userData.credits !== undefined
                            ? userData.credits
                            : "0"}
                        </span>
                      </div>
                    </div>

                    <DropdownMenuSeparator className="bg-primary/10" />

                    {/* Logout Section */}
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive py-2 rounded-lg m-0.5"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Mobile Menu (Sheet UI) */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-primary/5"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="border-l border-primary/10 bg-background/95 backdrop-blur-xl flex flex-col justify-between p-6 w-[300px]"
              >
                {/* Top Section: Header & Nav Links */}
                <div className="flex flex-col gap-8 flex-1">
                  <SheetHeader className="text-left">
                    <SheetTitle className="flex items-center gap-2 pt-2 text-xl font-bold tracking-tight">
                      <div className="bg-primary/10 p-1 rounded-md">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      LUME<span className="text-primary">.AI</span>
                    </SheetTitle>
                  </SheetHeader>

                  {/* Navigation Links */}
                  <nav className="flex flex-col gap-4">
                    {navItems.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        className="text-base font-medium tracking-tight text-muted-foreground hover:text-primary transition-colors py-1.5 px-1 rounded-lg hover:bg-primary/5 transition-all"
                      >
                        {item.name}
                      </a>
                    ))}
                  </nav>
                </div>

                {/* Bottom Section: Actions & Profile */}
                <div className="pt-6 border-t border-primary/10 flex flex-col gap-3">
                  {!userData ? (
                    <>
                      <LoginModal>
                        <Button
                          variant="outline"
                          className="w-full h-10 border-primary/10"
                        >
                          Log in
                        </Button>
                      </LoginModal>
                      <LoginModal>
                        <Button className="w-full h-10 bg-primary shadow-[0_0_15px_rgba(var(--primary),0.15)]">
                          Start Free Trial
                        </Button>
                      </LoginModal>
                    </>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {/* Premium Mobile Profile Wrapper */}
                      <div className="flex flex-col gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10 shadow-sm">
                        {/* Avatar, Name & Email */}
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-primary/20 shadow-sm">
                            <AvatarImage
                              src={userData.avatar}
                              alt={userData.name || "User"}
                            />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                              {getUserInitials(userData.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0 text-left">
                            <span className="text-sm font-bold text-foreground truncate">
                              {userData.name}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {userData.email}
                            </span>
                          </div>
                        </div>

                        {/* Dynamic Stats Row (Plan & Credits) */}
                        <div className="grid grid-cols-2 gap-2 pt-2.5 mt-1 border-t border-primary/5 text-[11px]">
                          {userData.plan && (
                            <div className="bg-background/50 px-2 py-1.5 rounded-md border border-primary/5 flex flex-col gap-0.5">
                              <span className="text-muted-foreground font-medium">
                                Plan
                              </span>
                              <span className="font-extrabold text-primary uppercase tracking-wider">
                                {userData.plan}
                              </span>
                            </div>
                          )}
                          <div className="bg-background/50 px-2 py-1.5 rounded-md border border-primary/5 flex flex-col gap-0.5">
                            <span className="text-muted-foreground font-medium">
                              Credits
                            </span>
                            <span className="font-bold text-foreground flex items-center gap-1">
                              <Coins className="h-3 w-3 text-amber-500 fill-amber-500/20" />
                              {userData.credits !== undefined
                                ? userData.credits
                                : "0"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Core Interaction Buttons */}
                      <Button
                        variant="outline"
                        className="w-full gap-2.5 justify-start h-10 font-medium text-sm border-primary/10 hover:bg-primary/5"
                        onClick={() => navigate("/dashboard")}
                      >
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                        Dashboard
                      </Button>

                      <Button
                        variant="destructive"
                        className="w-full gap-2.5 justify-start h-10 font-medium text-sm bg-destructive/5 hover:bg-destructive text-destructive hover:text-destructive-foreground border border-destructive/10 transition-all"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4" />
                        Log out
                      </Button>
                    </div>
                  )}
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
