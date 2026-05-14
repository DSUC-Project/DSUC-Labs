import React from "react";
import { motion } from "motion/react";
import { AppBackground } from "../layout/AppBackground";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-main-bg font-sans">
      <AppBackground intensity="medium" className="z-0" />

      <div className="z-10 flex flex-col items-center">
        <div className="relative w-32 h-32 flex items-center justify-center mb-8">
          {/* Pulse */}
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
          />
          {/* Rotating Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-t-2 border-r-2 border-primary dark:border-accent rounded-full opacity-80"
          />
          {/* Secondary Ring (reverse) */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-4 border-b-2 border-l-2 border-accent dark:border-primary rounded-full opacity-60"
          />
          {/* Logo */}
          <div className="w-16 h-16 bg-surface  flex items-center justify-center font-display font-bold text-2xl z-10 shadow-lg select-none">
            D
          </div>
        </div>

        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="font-mono text-sm uppercase tracking-widest text-text-muted font-bold"
        >
          Loading DSUC Labs...
        </motion.p>
      </div>
    </div>
  );
}
