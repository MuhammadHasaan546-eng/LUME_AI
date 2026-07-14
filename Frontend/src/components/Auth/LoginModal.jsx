import React, { useState } from "react"; // useState import kiya
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sparkles } from "lucide-react";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "@/config/firebase";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { login } from "@/api/auth";
import { toast } from "sonner";

const LoginModal = ({ children }) => {
  const dispatch = useDispatch();
  // Modal ki open/close state ko control karne ke liye
  const [open, setOpen] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);

      const userData = {
        email: result.user.email,
        name: result.user.displayName,
        avatar: result.user.photoURL,
      };

      // 1. Redux store mein login data bheja
      dispatch(login(userData));

      // 2. Successful login ke baad modal ko automatic close kar diya
      setOpen(false);
      toast.success("Logged in successfully!");
    } catch (error) {
      toast.error("Failed to log in.");
    }
  };

  return (
    // open aur onOpenChange props lagaye taake state manually handle ho sake
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || <Button>Log in</Button>}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[400px] border-primary/10 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden ring-0 focus:ring-0 outline-none">
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 blur-[80px] -z-10 rounded-full" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <DialogHeader className="items-center text-center space-y-4 pt-4">
            <div className="bg-primary p-2 rounded-xl shadow-[0_0_20px_rgba(var(--primary),0.3)]">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tighter uppercase">
              LUME <span className="text-primary">AI</span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              The next generation of web building.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-8 px-2">
            {/* GOOGLE BUTTON */}
            <Button
              variant="outline"
              className="h-12 gap-3 font-bold border-primary/10 hover:bg-primary/5 hover:border-primary/20 transition-all w-full"
              onClick={handleGoogleLogin}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="flex items-center gap-4 py-2">
              <Separator className="flex-1 bg-primary/10 w-[98%]" />
            </div>
          </div>

          <p className="text-[11px] text-center text-muted-foreground px-4 pb-4">
            By signing in, you agree to our
            <Link to="#" className="text-primary hover:underline mx-1">
              Terms
            </Link>{" "}
            &
            <Link to="#" className="text-primary hover:underline ml-1">
              Privacy Policy
            </Link>
            .
          </p>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
