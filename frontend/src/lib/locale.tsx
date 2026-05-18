import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export type AppLocale = "ENG" | "VIE";

type LocaleContextValue = {
  locale: AppLocale;
  isTransitioning: boolean;
  setLocale: (locale: AppLocale) => void;
  toggleLocale: () => void;
};

const LOCALE_STORAGE_KEY = "dsuc-locale";

function readStoredLocale(): AppLocale {
  if (typeof window === "undefined") {
    return "ENG";
  }

  const value = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return value === "VIE" ? "VIE" : "ENG";
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const shouldReduceMotion = useReducedMotion();
  const [locale, setLocaleState] = useState<AppLocale>(() => readStoredLocale());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionSource, setTransitionSource] = useState<AppLocale | null>(null);
  const [transitionTarget, setTransitionTarget] = useState<AppLocale | null>(null);
  const transitionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale === "VIE" ? "vi" : "en";
    document.documentElement.dataset.locale = locale;
  }, [locale]);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  const beginTransition = useCallback(
    (next: AppLocale) => {
      if (next === locale) {
        return;
      }

      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
      }

      setTransitionTarget(next);
      setTransitionSource(locale);
      setIsTransitioning(true);
      setLocaleState(next);

      transitionTimerRef.current = window.setTimeout(() => {
        setIsTransitioning(false);
        setTransitionSource(null);
        setTransitionTarget(null);
      }, shouldReduceMotion ? 120 : 420);
    },
    [locale, shouldReduceMotion],
  );

  const setLocale = useCallback(
    (next: AppLocale) => {
      beginTransition(next);
    },
    [beginTransition],
  );

  const toggleLocale = useCallback(() => {
    beginTransition(locale === "ENG" ? "VIE" : "ENG");
  }, [beginTransition, locale]);

  const value = useMemo(
    () => ({
      locale,
      isTransitioning,
      setLocale,
      toggleLocale,
    }),
    [isTransitioning, locale, setLocale, toggleLocale],
  );

  const overlayLocale = transitionTarget ?? locale;
  const transitionTitle =
    overlayLocale === "VIE" ? "ĐANG CHUYỂN NGÔN NGỮ" : "SWITCHING LANGUAGE";
  const transitionLabel =
    overlayLocale === "VIE" ? "Đang cập nhật giao diện..." : "Refreshing the interface...";
  const transitionHint =
    transitionSource && transitionTarget ? `${transitionSource} → ${transitionTarget}` : locale;

  return (
    <LocaleContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {isTransitioning ? (
          <motion.div
            key="locale-transition-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: "easeOut" }}
            className="pointer-events-none fixed inset-0 z-[140] flex items-center justify-center bg-main-bg/45 px-4 backdrop-blur-[1px]"
            aria-live="polite"
          >
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
              animate={shouldReduceMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
              exit={shouldReduceMotion ? {} : { opacity: 0, y: 6, scale: 0.99 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: "easeOut" }}
              className="w-full max-w-sm border-[3px] border-text-main bg-surface p-4 shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff]"
            >
              <div className="mb-3 flex items-center justify-between gap-3 border-b-[3px] border-text-main pb-3">
                <div>
                  <p className="font-display text-lg uppercase tracking-wide text-text-main">
                    {transitionTitle}
                  </p>
                  <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-text-muted">
                    {transitionHint}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 bg-primary" />
                  <span className="h-2.5 w-2.5 bg-text-main/30" />
                  <span className="h-2.5 w-2.5 bg-text-main/15" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="h-2.5 overflow-hidden border-2 border-text-main bg-main-bg/60">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ scaleX: 0.15, originX: 0 }}
                    animate={{ scaleX: 1, originX: 0 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.32, ease: "easeOut" }}
                  />
                </div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">
                  {transitionLabel}
                </p>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider.");
  }

  const isVIE = context.locale === "VIE";

  return {
    ...context,
    isVIE,
    text(english: string, vietnamese: string) {
      return isVIE ? vietnamese : english;
    },
  };
}
