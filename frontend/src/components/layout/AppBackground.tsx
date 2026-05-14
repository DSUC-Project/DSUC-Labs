import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface AppBackgroundProps {
  intensity?: "low" | "medium" | "high";
  className?: string;
}

export function AppBackground({
  intensity = "medium",
  className,
}: AppBackgroundProps) {
  // Configured based on intensity
  const dotOpacity =
    intensity === "low"
      ? "opacity-40"
      : intensity === "medium"
        ? "opacity-60"
        : "opacity-80";
  const elementOpacity =
    intensity === "low"
      ? "opacity-20"
      : intensity === "medium"
        ? "opacity-40"
        : "opacity-60";

  return (
    <div
      className={cn(
        "fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-main-bg transition-colors duration-300",
        className,
      )}
    >
      {/* LAYER 1: Paper dot grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className={cn(
          "absolute inset-0 bg-[radial-gradient(var(--color-border-main)_1px,transparent_1px)] [background-size:24px_24px]",
          dotOpacity,
          "dark:opacity-10",
        )}
        style={{ backgroundPosition: "center center" }}
      >
        <motion.div
          animate={{ x: [0, -24], y: [0, -24] }}
          transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
          className="w-[200%] h-[200%] bg-transparent"
        />
      </motion.div>

      {/* LAYER 2: Tech text snippets (Faded binary/code) */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-around",
          elementOpacity,
        )}
      >
        {intensity !== "low" && (
          <>
            <motion.div
              animate={{ y: [0, -100] }}
              transition={{
                repeat: Infinity,
                duration: 30,
                ease: "linear",
                repeatType: "mirror",
              }}
              className="font-mono text-xs text-text-muted/25 dark:text-text-muted/35 select-none whitespace-pre"
            >
              01010101{"\n"}10110011{"\n"}00101101
            </motion.div>
            <motion.div
              animate={{ y: [0, 80] }}
              transition={{
                repeat: Infinity,
                duration: 35,
                ease: "linear",
                repeatType: "mirror",
              }}
              className="font-mono text-xs text-text-muted/25 dark:text-text-muted/35 select-none whitespace-pre hidden md:block"
            >
              const builder = "DSUC";{"\n"}learn();{"\n"}ship();
            </motion.div>
            <motion.div
              animate={{ y: [0, -60] }}
              transition={{
                repeat: Infinity,
                duration: 45,
                ease: "linear",
                repeatType: "mirror",
              }}
              className="font-mono text-xs text-text-muted/25 dark:text-text-muted/35 select-none whitespace-pre hidden lg:block"
            >
              fn main() {"{"}
              {"\n"} println!("Ship.");{"\n"}
              {"}"}
            </motion.div>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
              className="font-mono text-[10px] text-text-muted/25 dark:text-text-muted/30 select-none absolute bottom-8 right-8"
            >
              anchor build {"\n"}solana program deploy
            </motion.div>
          </>
        )}
      </div>

      {/* LAYER 3: Geometric / Solana watermark */}
      <div
        className={cn(
          "absolute inset-0 flex justify-center items-center",
          elementOpacity,
        )}
      >
        {/* Subtle geometric circles/lines */}
        <div className="absolute w-[600px] h-[600px] /35 dark:border-border-main/15 rounded-full" />
        <div className="absolute w-[400px] h-[400px] border border-border-main/45 dark:border-border-main/25 rounded-full" />
        {intensity === "high" && (
          <div className="absolute top-1/4 left-1/4 w-32 h-32/40 dark:-main/20" />
        )}
      </div>
    </div>
  );
}
