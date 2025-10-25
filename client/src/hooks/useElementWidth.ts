import React, { useEffect, useState } from "react";

export function useElementWidth(ref: React.RefObject<HTMLDivElement | null>) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    setWidth(ref.current.clientWidth);
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w =
          (e.contentRect && e.contentRect.width) || ref.current!.clientWidth;
        setWidth(Math.floor(w));
      }
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}
