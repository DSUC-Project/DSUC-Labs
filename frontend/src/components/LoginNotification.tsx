import React, { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CheckCircle2,
  FlaskConical,
  Mail,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/locale";

interface LoginNotificationProps {
  isVisible: boolean;
  userName?: string;
  authMethod?: "wallet" | "google" | "local";
  onDismiss: () => void;
}

export function LoginNotification({
  isVisible,
  userName = "User",
  authMethod = "wallet",
  onDismiss,
}: LoginNotificationProps) {
  const { text } = useLocale();
  const authMethodLabel =
    authMethod === "google"
      ? "Google"
      : authMethod === "local"
        ? text("Local Admin", "Admin local")
        : "Wallet";
  const methodMeta =
    authMethod === "google"
      ? {
          icon: Mail,
          badgeClassName: "bg-primary/10 text-primary",
          helperCopy: text(
            "Signed in with your DSUC Google account.",
            "Bạn đã đăng nhập bằng tài khoản Google DSUC.",
          ),
        }
      : authMethod === "local"
        ? {
            icon: FlaskConical,
            badgeClassName: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
            helperCopy: text(
              "Local development admin session is active.",
              "Phiên admin local cho môi trường phát triển đang hoạt động.",
            ),
          }
        : {
            icon: Wallet,
            badgeClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
            helperCopy: text(
              "Wallet authentication is active on this device.",
              "Phiên xác thực bằng wallet đang hoạt động trên thiết bị này.",
            ),
          };
  const MethodIcon = methodMeta.icon;

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const timer = window.setTimeout(onDismiss, 3200);
    return () => window.clearTimeout(timer);
  }, [isVisible, onDismiss]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 280, damping: 24 }}
          className="fixed inset-x-4 bottom-4 z-[110] sm:inset-x-auto sm:right-6 sm:top-20 sm:bottom-auto sm:w-[380px]"
          role="status"
          aria-live="polite"
        >
          <div className="relative overflow-hidden border border-border-main bg-surface shadow-[6px_6px_0_0_rgba(0,0,0,0.16)] dark:shadow-[6px_6px_0_0_rgba(0,0,0,0.4)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rotate-12 bg-primary/10" />

            <div className="relative flex items-start gap-4 p-4 sm:p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-border-main bg-primary/10 text-primary shadow-sm">
                <CheckCircle2
                  className="h-6 w-6"
                  strokeWidth={2.5}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-2 bg-primary px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-main-bg">
                      <MethodIcon className="h-3.5 w-3.5" />
                      {text("Login Success", "Đăng nhập thành công")}
                    </div>
                    <p className="mt-3 text-lg font-heading font-bold leading-tight text-text-main">
                      {userName}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onDismiss}
                    className="flex h-10 w-10 shrink-0 items-center justify-center border border-border-main bg-main-bg text-text-muted transition-colors hover:bg-surface hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    aria-label={text("Close notification", "Đóng thông báo")}
                  >
                    <X size={16} strokeWidth={2.5} />
                  </button>
                </div>

                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  {methodMeta.helperCopy}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={cn(
                      "inline-flex min-h-9 items-center gap-2 border border-border-main px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest",
                      methodMeta.badgeClassName,
                    )}
                  >
                    <MethodIcon className="h-3.5 w-3.5" />
                    {authMethodLabel}
                  </span>
                  <span className="inline-flex min-h-9 items-center border border-border-main bg-main-bg px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted">
                    {text("Session Ready", "Phiên đã sẵn sàng")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
