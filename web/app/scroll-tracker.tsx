"use client";

import { useEffect } from "react";

export default function ScrollTracker() {
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        document.documentElement.classList.add("scrolled");
      } else {
        document.documentElement.classList.remove("scrolled");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return null;
}
