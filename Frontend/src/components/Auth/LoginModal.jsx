import React from "react";
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
import { Sparkles } from "lucide-react"; // Sirf Sparkles rakha hai jo kaam kar raha hai
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "@/config/firebase";

const LoginModal = ({ children }) => {
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      console.log(result);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Dialog>
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
            {/* GOOGLE BUTTON (Direct SVG) */}
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
              <Separator className="flex-1 bg-primary/10" />
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                OR
              </span>
              <Separator className="flex-1 bg-primary/10" />
            </div>

            {/* GITHUB BUTTON (Direct SVG - No Import Required) */}
            <Button
              variant="outline"
              className="h-12 gap-3 border-primary/10 hover:bg-primary/5 transition-all font-semibold w-full"
            >
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Continue with GitHub
            </Button>
          </div>

          <p className="text-[11px] text-center text-muted-foreground px-4 pb-4">
            By signing in, you agree to our
            <a href="#" className="text-primary hover:underline mx-1">
              Terms
            </a>{" "}
            &
            <a href="#" className="text-primary hover:underline ml-1">
              Privacy Policy
            </a>
            .
          </p>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
