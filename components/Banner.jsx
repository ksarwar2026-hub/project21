'use client'

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

const announcementSlides = [
  "Free shipping above Rs. 499",
  "New hair care collection now live",
  "Premium routines inspired by modern homeopathic principles",
];

export default function Banner() {
  const [isOpen, setIsOpen] = React.useState(true);
  const [activeSlide, setActiveSlide] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);

  React.useEffect(() => {
    if (isPaused) return undefined;

    const timer = setInterval(() => {
      setActiveSlide((current) => (current + 1) % announcementSlides.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [isPaused]);

  if (!isOpen) return null;

  return (
    <div
      className="relative z-[60] bg-[#344E41] px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-white"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="mx-auto flex max-w-[1440px] items-center justify-center px-8 md:px-10 lg:px-20">
        <div className="relative h-5 w-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={announcementSlides[activeSlide]}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center leading-5"
            >
              {announcementSlides[activeSlide]}
            </motion.p>
          </AnimatePresence>
        </div>
        <button
          type="button"
          aria-label="Close announcement"
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/75 transition hover:bg-white/10 hover:text-white"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
