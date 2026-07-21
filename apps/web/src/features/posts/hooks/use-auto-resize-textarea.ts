"use client";

import * as React from "react";

/** Grows a textarea's height to fit its content as `value` changes. */
export function useAutoResizeTextarea(value: string) {
  const ref = React.useRef<HTMLTextAreaElement | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return ref;
}
