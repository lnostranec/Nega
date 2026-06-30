import { useEffect } from "react";

function getScrollbarWidth() {
  return Math.max(0, window.innerWidth - document.documentElement.clientWidth);
}

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const scrollbarWidth = getScrollbarWidth();
    const html = document.documentElement;
    const body = document.body;

    const saved = {
      bodyOverflow: body.style.overflow,
      bodyPaddingRight: body.style.paddingRight,
      scrollbarWidth: html.style.getPropertyValue("--scrollbar-width"),
    };

    if (scrollbarWidth > 0) {
      html.style.setProperty("--scrollbar-width", `${scrollbarWidth}px`);
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    html.classList.add("scroll-locked");
    body.style.overflow = "hidden";

    return () => {
      html.classList.remove("scroll-locked");
      html.style.setProperty("--scrollbar-width", saved.scrollbarWidth);
      body.style.overflow = saved.bodyOverflow;
      body.style.paddingRight = saved.bodyPaddingRight;
    };
  }, [locked]);
}
