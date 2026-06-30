"use client";

import { useEffect, useState } from "react";

export function usePrefersHover(): boolean {
  const [prefersHover, setPrefersHover] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setPrefersHover(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return prefersHover;
}
