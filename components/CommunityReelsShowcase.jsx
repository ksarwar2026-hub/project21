'use client'

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Eye,
  Heart,
  Instagram,
  Play,
  X,
} from "lucide-react";

const reels = [
  {
    video: "/assets/reels/reel1.mp4",
    thumbnail: "/assets/reels/ReelPhoto1.jpg",
    username: "hairwithzoya",
    verified: true,
    title: "Rosemary Hair Oil Routine",
    duration: "Used for 2 months",
    views: "1.2M",
    likes: "94K",
  },
  {
    video: "/assets/reels/reel2.mp4",
    thumbnail: "/assets/reels/ReelPhoto2.jpg",
    username: "matin_khan",
    verified: true,
    title: "Anti Hair Fall Shampoo",
    duration: "Used for 6 weeks",
    views: "873K",
    likes: "72K",
  },
  {
    video: "/assets/reels/reel3.mp4",
    thumbnail: "/assets/reels/ReelPhoto3.jpg",
    username: "glow_with_neha",
    verified: true,
    title: "Nourishing Hair Mask",
    duration: "Used for 1 month",
    views: "654K",
    likes: "58K",
  },
  {
    video: "/assets/reels/reel4.mp4",
    thumbnail: "/assets/reels/ReelPhoto4.jpg",
    username: "ranveer_hairjourney",
    verified: true,
    title: "Onion Hair Oil Routine",
    duration: "Used for 3 months",
    views: "1.1M",
    likes: "88K",
  },
];

function getInitials(username) {
  return username
    .split("_")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function CommunityReelsShowcase() {
  const [activeReel, setActiveReel] = useState(null);

  useEffect(() => {
    if (!activeReel) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [activeReel]);

  return (
    <section className="bg-[radial-gradient(circle_at_top_left,rgba(215,229,187,0.16),transparent_34%),linear-gradient(135deg,#10281F_0%,#1E372B_48%,#0B1712_100%)] px-5 py-14 text-white md:px-10 md:py-20 lg:px-20">
      <div className="mx-auto max-w-[1440px]">
        <div className="max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D7E5BB]"
          >
            FROM OUR COMMUNITY
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            className="mt-4 font-serif text-4xl font-medium leading-tight sm:text-5xl"
          >
            Real people. Real routines.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            className="mt-4 max-w-xl text-sm leading-7 text-white/78 sm:text-base"
          >
            Honest stories and real results from our community.
          </motion.p>
        </div>

        <div className="mt-11 flex snap-x gap-4 overflow-x-auto pb-5 [scrollbar-width:none] md:grid md:grid-cols-2 md:overflow-visible md:pb-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
          {reels.map((reel, index) => (
            <motion.button
              key={reel.username}
              type="button"
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.48, delay: 0.1 * index, ease: "easeOut" }}
              onClick={() => setActiveReel(reel)}
              className="group min-w-[80%] snap-start rounded-[24px] border border-white/16 bg-white/8 p-3 text-left shadow-[0_18px_54px_rgba(0,0,0,0.18)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/10 hover:shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:min-w-[360px] md:min-w-0"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-black/20">
                <Image
                  src={reel.thumbnail}
                  alt={`${reel.title} by ${reel.username}`}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 80vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute right-3 top-3 rounded-full bg-white/88 p-1.5 text-[#1E372B] shadow-sm backdrop-blur">
                  <Instagram size={16} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/42 text-white backdrop-blur-sm transition duration-300 group-hover:scale-105 group-hover:bg-black/52">
                    <Play size={28} className="ml-1 fill-current" />
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-4 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.72))] px-4 pb-4 pt-14 text-sm font-semibold text-white">
                  <span className="inline-flex items-center gap-1.5">
                    <Eye size={16} />
                    {reel.views}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Heart size={15} className="fill-current" />
                    {reel.likes}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-[42px_1fr_auto] gap-3 px-1 pb-1 pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#D7E5BB] text-xs font-semibold text-[#1E372B]">
                  {getInitials(reel.username)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-white">@{reel.username}</p>
                    {reel.verified && <BadgeCheck size={15} className="shrink-0 fill-[#BFE6B1] text-[#1E372B]" />}
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-white/92">{reel.title}</p>
                  <p className="mt-1 text-xs text-white/68">{reel.duration}</p>
                </div>
                <Instagram size={20} className="mt-6 text-white/82" />
              </div>
            </motion.button>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-center md:gap-28">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D7E5BB]/18 text-[#D7E5BB]">
              <Instagram size={25} />
            </div>
            <div>
              <p className="font-serif text-xl font-medium">Be a part of our journey</p>
              <p className="mt-1 text-sm text-white/74">Tag us on Instagram @k.sarwar.care</p>
            </div>
          </div>
          <a
            href="/shop"
            className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-white/35 px-7 text-sm font-semibold text-white transition hover:border-[#D7E5BB] hover:text-[#D7E5BB]"
          >
            Explore More Stories <ArrowRight size={17} />
          </a>
        </div>
      </div>

      <AnimatePresence>
        {activeReel && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/72 px-4 py-6 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveReel(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="relative w-full max-w-[420px] overflow-hidden rounded-[24px] border border-white/18 bg-[#10281F] shadow-[0_28px_90px_rgba(0,0,0,0.45)]"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Close reel"
                onClick={() => setActiveReel(null)}
                className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/65"
              >
                <X size={18} />
              </button>
              <video
                key={activeReel.video}
                src={activeReel.video}
                poster={activeReel.thumbnail}
                className="aspect-[9/16] w-full bg-black object-cover"
                controls
                autoPlay
                playsInline
                preload="none"
              />
              <div className="p-4">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-white">@{activeReel.username}</p>
                  {activeReel.verified && <BadgeCheck size={15} className="fill-[#BFE6B1] text-[#1E372B]" />}
                </div>
                <p className="mt-1 text-sm text-white/80">{activeReel.title}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
