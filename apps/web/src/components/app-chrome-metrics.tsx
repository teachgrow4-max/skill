"use client";

import * as React from "react";

const BARS = [
  { selector: "[data-app-top-bar]", variable: "--app-top-bar-height" },
  { selector: "[data-app-bottom-nav]", variable: "--app-bottom-nav-height" },
] as const;

/**
 * Publishes the mobile top bar's and bottom nav's real rendered heights as
 * CSS variables (see globals.css), so full-height content like reels fits
 * between them on every phone. Safe-area insets and enlarged system text both
 * make the bars taller than any fixed guess — a reel sized with one slid its
 * bottom (and its save button) under the nav.
 */
export function AppChromeMetrics() {
  React.useEffect(() => {
    const root = document.documentElement;
    const elements = BARS.map((bar) => ({ ...bar, el: document.querySelector<HTMLElement>(bar.selector) }));

    function publish() {
      for (const { el, variable } of elements) {
        // Hidden on desktop (md:hidden) measures 0 — keep the CSS fallback.
        if (el && el.offsetHeight > 0) root.style.setProperty(variable, `${el.offsetHeight}px`);
      }
    }

    // Measure right away too — ResizeObserver only reports on a rendered
    // frame, which a backgrounded tab/WebView may not produce for a while.
    publish();
    const observer = new ResizeObserver(publish);
    // border-box: the safe-area insets are padding, and they change on rotation
    // without the content box changing at all.
    for (const { el } of elements) if (el) observer.observe(el, { box: "border-box" });

    return () => {
      observer.disconnect();
      for (const { variable } of elements) root.style.removeProperty(variable);
    };
  }, []);

  return null;
}
