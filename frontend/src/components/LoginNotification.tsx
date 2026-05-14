import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Moon, Sun, X } from "lucide-react";

interface LoginNotificationProps {
  isVisible: boolean;
  userName?: string;
  authMethod?: "wallet" | "google";
  onDismiss: () => void;
}

export function LoginNotification({
  isVisible,
  userName = "User",
  authMethod = "wallet",
  onDismiss,
}: LoginNotificationProps) {
  const [autoClose, setAutoClose] = useState(true);
  const authMethodLabel = authMethod === "google" ? "Google" : "Wallet";

  useEffect(() => {
    if (!isVisible || !autoClose) {
      return;
    }

    const timer = window.setTimeout(onDismiss, 4000);
    return () => window.clearTimeout(timer);
  }, [autoClose, isVisible, onDismiss]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -18, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -18, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 280, damping: 24 }}
          className="fixed left-1/2 top-24 z-[10000] w-[min(92vw,460px)] -translate-x-1/2"
        >
          <div className="relative overflow-hidden -black bg-white shadow-lg">
            <div className="absolute left-0 top-0 h-full w-4 -4 -black bg-emerald-400" />
            <div className="absolute -right-6 -top-6 h-20 w-20 rotate-12 -black bg-accent shadow-sm" />

            <div className="relative flex items-start gap-4 p-5 pl-7">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center -black bg-emerald-400 shadow-sm">
                <CheckCircle2
                  className="h-7 w-7 text-text-main"
                  strokeWidth={3}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-2 inline-flex items-center gap-2 -black bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-sm">
                  {authMethod === "google" ? (
                    <Sun size={12} />
                  ) : (
                    <Moon size={12} />
                  )}
                  Đăng nhập thành công
                </div>
                <div className="font-display text-2xl font-black uppercase tracking-tight text-text-main">
                  {userName}
                </div>
                <p className="mt-3 border-l-4 border-text-main pl-3 text-xs font-bold uppercase tracking-widest text-gray-700">
                  Phương thức: {authMethodLabel}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAutoClose(false);
                  onDismiss();
                }}
                className="shrink-0 border-2 border-transparent bg-white p-2 text-text-main transition-colors hover:border-text-main hover:bg-pink-400"
                aria-label="Close notification"
              >
                <X size={18} strokeWidth={3} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
