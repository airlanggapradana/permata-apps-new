"use client";

import React, { createContext, useContext } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { TransitionPhase } from "./PageTransitionOverlay";

const PageReadyContext = createContext<boolean>(true);

/**
 * Exposes whether the global PERMATA page transition curtain has started
 * revealing the current page (`exiting` or `idle`).
 */
export function PageMotionProvider({
  transitionPhase,
  children,
}: {
  transitionPhase: TransitionPhase;
  children: React.ReactNode;
}) {
  const ready = transitionPhase === "exiting" || transitionPhase === "idle";
  return (
    <PageReadyContext.Provider value={ready}>
      {children}
    </PageReadyContext.Provider>
  );
}

export function usePageReady(): boolean {
  return useContext(PageReadyContext);
}

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  visible: (index: number = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.48,
      delay: Math.min(index * 0.06, 0.65),
      ease: EASE_OUT,
    },
  }),
};

/**
 * One-shot entrance animation on initial page render, synchronized with the
 * page transition overlay and disabled when `prefers-reduced-motion` is active.
 */
export function AnimatedSection({
  index = 0,
  ready: readyProp,
  className = "",
  children,
}: {
  index?: number;
  ready?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const contextReady = usePageReady();
  const ready = readyProp ?? contextReady;
  const prefersReducedMotion = Boolean(useReducedMotion());

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      custom={index}
      variants={sectionVariants}
      initial="hidden"
      animate={ready ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}
