import React, { useEffect, useState } from "react";

/**
 * Hook to get the width of an element.
 * @param ref React ref object pointing to the target HTMLDivElement
 * @returns The width of the element in pixels
 */
export function useElementWidth(ref: React.RefObject<HTMLDivElement | null>) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;
    setWidth(element.clientWidth);

    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        if (!element) return;
        const w = (e.contentRect && e.contentRect.width) || element.clientWidth;
        setWidth(Math.floor(w));
      }
    });

    ro.observe(element);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}
