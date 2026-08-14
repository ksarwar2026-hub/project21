'use client'

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import {
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Factory,
  FlaskConical,
  Heart,
  HeartHandshake,
  Leaf,
  Lightbulb,
  Mail,
  MessageCircle,
  Microscope,
  ScrollText,
  PackageCheck,
  Quote,
  RotateCcw,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";
import { assets } from "@/assets/assets";
import { addToCart } from "@/lib/features/cart/cartSlice";
import CommunityReelsShowcase from "@/components/CommunityReelsShowcase";

const heroSlides = [
  {
    id: "hero-banner-1",
    desktopImage: assets.heroBanner1,
    mobileImage: assets.heroBannerMobile1,
    imageAlt: "K-SARWAR hero banner 1",
  },
  {
    id: "hero-banner-2",
    desktopImage: assets.heroBanner2B,
    mobileImage: assets.heroBannerMobile2B,
    imageAlt: "K-SARWAR hero banner 2",
  },
  {
    id: "hero-banner-3",
    desktopImage: assets.heroBanner3,
    mobileImage: assets.heroBannerMobile3,
    imageAlt: "K-SARWAR hero banner 3",
  },
];

const trustItems = [
  { title: "Secure Checkout", icon: ShieldCheck },
  { title: "Quality Focused", icon: BadgeCheck },
  { title: "Fast Shipping", icon: Truck },
  { title: "Customer Support", icon: HeartHandshake },
  { title: "Satisfaction Promise", icon: PackageCheck },
];

const concerns = [
  {
    title: "Hair Fall",
    description: "Weak roots",
    href: "/shop?search=hair%20fall",
    image: assets.concernHairfall,
  },
  {
    title: "Dandruff",
    description: "Flakes and itch",
    href: "/shop?search=dandruff",
    image: assets.concernDandruff,
  },
  {
    title: "Dry Hair",
    description: "Rough lengths",
    href: "/shop?search=dry%20hair",
    image: assets.concernDryHair,
  },
  {
    title: "Frizzy Hair",
    description: "Flyaways",
    href: "/shop?search=frizzy%20hair",
    image: assets.concernFrizzHair,
  },
];

const productShowcase = [
  {
    label: "Product Story",
    title: "Scalp Repair Ritual",
    description: "A focused look at the signature routine and its role in daily hair care.",
    image: assets.KsShampoo,
    imageFit: "contain",
    cta: "Add to Cart",
    metric: "Daily routine",
    fallbackPrice: 1499,
  },
  {
    label: "Ingredients",
    title: "Botanical cues, clearly explained.",
    description: "Ingredient storytelling stays simple, visual, and easy to trust.",
    image: assets.hero_product_img1,
    imageFit: "contain",
    cta: "View Formula",
    metric: "Selected base",
    fallbackPrice: 1299,
  },
  {
    label: "Benefits",
    title: "Care designed for visible routine goals.",
    description: "Minimal claims, strong guidance, and a premium shopping decision.",
    image: assets.hero_product_img2,
    imageFit: "contain",
    cta: "See Benefits",
    metric: "Hair and scalp",
    fallbackPrice: 1399,
  },
  {
    label: "How to Use",
    title: "A simple ritual customers can repeat.",
    description: "Clear usage guidance reduces confusion before the product page.",
    image: assets.HeroBannerPC,
    imageFit: "cover",
    cta: "How to Use",
    metric: "3-step care",
    fallbackPrice: 1199,
  },
  {
    label: "Experience",
    title: "Premium packaging from shelf to delivery.",
    description: "A calm product moment for unboxing, gifting, and repeat purchase.",
    image: assets.HeroBannerMob,
    imageFit: "cover",
    cta: "Learn More",
    metric: "Premium finish",
    fallbackPrice: 1599,
  },
];

const chooseItems = [
  {
    title: "Research-Driven Formulas",
    description:
      "Research-backed ingredients chosen for performance, not trends.",
    icon: FlaskConical,
  },
  {
    title: "Premium Ingredients",
    description:
      "Selected for quality, safety and effectiveness to support healthier hair.",
    icon: Leaf,
  },
  {
    title: "Quality You Can Trust",
    description:
      "Consistent standards for a reliable hair care experience.",
    icon: ShieldCheck,
  },
  {
    title: "Transparent Hair Care",
    description:
      "Clear ingredients, honest communication and no exaggerated promises.",
    icon: ScrollText,
  },
];

const processSteps = [
  {
    title: "Idea",
    description: "Every formula starts with a real problem.",
    icon: Lightbulb,
  },
  {
    title: "Ingredient Research",
    description: "Carefully selected ingredients before formulation.",
    icon: Microscope,
  },
  {
    title: "Formula Development",
    description: "Balanced for effectiveness and daily use.",
    icon: FlaskConical,
  },
  {
    title: "Safety & Stability Testing",
    description: "Checked for consistency and stability.",
    icon: ShieldCheck,
  },
  {
    title: "Responsible Manufacturing",
    description: "Produced using responsible quality standards.",
    icon: Factory,
  },
  {
    title: "Quality Inspection",
    description: "Reviewed before reaching customers.",
    icon: BadgeCheck,
  },
  {
    title: "Customer Feedback",
    description: "Real experiences guide future improvements.",
    icon: MessageCircle,
  },
  {
    title: "Continuous Improvement",
    description: "Research never stops.",
    icon: RotateCcw,
  },
];

const ingredientBanners = [
  {
    name: "Rosemary",
    desktopImage: assets.ingredient1Desktop,
    tabletImage: assets.ingredient1Tablet,
    mobileImage: assets.ingredient1Mobile,
  },
  {
    name: "Rice Water",
    desktopImage: assets.ingredient2Desktop,
    tabletImage: assets.ingredient2Tablet,
    mobileImage: assets.ingredient2Mobile,
  },
  {
    name: "Aloe Vera",
    desktopImage: assets.ingredient3Desktop,
    tabletImage: assets.ingredient3Tablet,
    mobileImage: assets.ingredient3Mobile,
  },
];

const customerStories = [
  {
    name: "Customer Story",
    location: "Bihar, India",
    product: "Hair care routine",
    quote: "A clean placeholder for real stories, photos, and timelines.",
  },
  {
    name: "Routine Note",
    location: "Verified buyer",
    product: "Scalp care",
    quote: "Replace this later with actual customer feedback and product used.",
  },
  {
    name: "Video Slot",
    location: "UGC ready",
    product: "Daily care",
    quote: "Designed for future video or reel proof without breaking layout.",
  },
];

const faqs = [
  {
    question: "How do I choose the right product?",
    answer:
      "Start with your concern, compare the product details, and choose the routine that feels easiest to follow consistently.",
  },
  {
    question: "Are these sections using final brand images?",
    answer:
      "Not yet. The homepage is structured so hero, collection, and showcase images can be replaced from central arrays later.",
  },
  {
    question: "Does the homepage make medical claims?",
    answer:
      "No. The copy is intentionally careful and focused on shopping guidance, routine clarity, and product education.",
  },
];

function getRating(product) {
  const ratings = product?.rating || [];
  if (!ratings.length) return null;
  return ratings.reduce((sum, item) => sum + item.rating, 0) / ratings.length;
}

function getCurrency() {
  return process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "Rs. ";
}

function SectionIntro({ eyebrow, title, description, align = "left", tone = "light" }) {
  const isDark = tone === "dark";

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}
    >
      <p className={`text-[11px] font-semibold uppercase tracking-[0.26em] ${isDark ? "text-[#B0CDBC]" : "text-[#566342]"}`}>
        {eyebrow}
      </p>
      <h2 className={`mt-3 font-serif text-3xl font-medium leading-tight sm:text-4xl lg:text-5xl ${isDark ? "text-[#FCF9F8]" : "text-[#1E372B]"}`}>
        {title}
      </h2>
      {description && (
        <p className={`mt-4 text-sm leading-7 sm:text-base ${isDark ? "text-white/75" : "text-[#5F665F]"}`}>{description}</p>
      )}
    </motion.div>
  );
}

function PlaceholderImage({ label, className = "" }) {
  return (
    <div className={`flex items-center justify-center bg-[#EAE7E7] ${className}`}>
      <span className="px-4 text-center text-xs font-semibold uppercase tracking-[0.22em] text-[#8B938C]">
        {label}
      </span>
    </div>
  );
}

function HeroSlide({ slide }) {
  return (
    <div className="relative min-h-[52vh] overflow-hidden bg-[#1E372B] sm:min-h-[55vh] lg:min-h-[70vh]">
      <Image
        src={slide.mobileImage}
        alt={slide.imageAlt}
        fill
        className="object-cover md:hidden"
        sizes="100vw"
        priority
      />
      <Image
        src={slide.desktopImage}
        alt={slide.imageAlt}
        fill
        className="hidden object-cover md:block"
        sizes="100vw"
        priority
      />
    </div>
  );
}

function HeroCarousel() {
  const [activeSlide, setActiveSlide] = useState(0);
  const goToSlide = (nextIndex) => {
    setActiveSlide((nextIndex + heroSlides.length) % heroSlides.length);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={heroSlides[activeSlide].id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <HeroSlide slide={heroSlides[activeSlide]} />
        </motion.div>
      </AnimatePresence>
      <button
        type="button"
        aria-label="Previous hero banner"
        onClick={() => goToSlide(activeSlide - 1)}
        className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/78 text-[#1E372B] shadow-[0_10px_28px_rgba(0,0,0,0.14)] backdrop-blur-md transition hover:bg-white md:left-6 md:h-12 md:w-12"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        type="button"
        aria-label="Next hero banner"
        onClick={() => goToSlide(activeSlide + 1)}
        className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/78 text-[#1E372B] shadow-[0_10px_28px_rgba(0,0,0,0.14)] backdrop-blur-md transition hover:bg-white md:right-6 md:h-12 md:w-12"
      >
        <ChevronRight size={22} />
      </button>
      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2 rounded-full bg-white/70 px-3 py-2 backdrop-blur-md">
        {heroSlides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            aria-label={`Go to hero slide ${index + 1}`}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all ${
              activeSlide === index ? "w-8 bg-[#1E372B]" : "w-2 bg-[#9CA59D]"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

function TrustStrip() {
  const repeated = [...trustItems, ...trustItems];

  return (
    <section className="border-y border-[#E5E2E1] bg-white/55 px-6 py-6 md:px-10 lg:px-20">
      <div className="mx-auto hidden max-w-[1440px] flex-wrap justify-between gap-6 md:flex">
        {trustItems.map((item) => (
          <div key={item.title} className="flex items-center gap-3 text-[#1E372B]">
            <item.icon className="h-5 w-5 text-[#4A6456]" />
            <span className="text-sm font-semibold">{item.title}</span>
          </div>
        ))}
      </div>
      <div className="md:hidden">
        <div className="overflow-hidden">
          <div
            className="flex w-max gap-8"
            style={{ animation: "marqueeScroll 24s linear infinite" }}
          >
            {repeated.map((item, index) => (
              <div key={`${item.title}-${index}`} className="flex items-center gap-3 text-[#1E372B]">
                <item.icon className="h-5 w-5 text-[#4A6456]" />
                <span className="whitespace-nowrap text-sm font-semibold">{item.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product }) {
  const rating = getRating(product);
  const currency = getCurrency();
  const dispatch = useDispatch();
  const { user } = useUser();
  const reviewCount = product.rating?.length || 0;
  const originalPrice =
    product.mrp && product.mrp > product.price ? product.mrp : Math.round(product.price * 1.18);
  const discount = Math.max(0, Math.round(((originalPrice - product.price) / originalPrice) * 100));
  const benefit = product.category
    ? `${product.category} support for daily routines.`
    : "Daily care for healthier-looking hair.";

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!product.inStock) {
      toast("Currently out of stock");
      return;
    }

    if (!user) {
      toast("Please login to add to cart");
      return;
    }

    dispatch(addToCart({ productId: product.id }));
    toast.success("Added to cart");
  };

  return (
    <Link
      href={`/product/${product.id}`}
      className="group flex h-[355px] flex-col rounded-[18px] border border-[#E5E2E1] bg-[#FCF9F8] p-2.5 shadow-[0_12px_30px_rgba(30,55,43,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_46px_rgba(30,55,43,0.1)] sm:h-[395px] sm:rounded-[22px] lg:h-[435px]"
    >
      <div className="relative aspect-square shrink-0 overflow-hidden rounded-[15px] bg-[#F0EDED] sm:rounded-[18px]">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-contain p-2 transition duration-700 group-hover:scale-105 sm:p-3"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <PlaceholderImage label="Image pending" className="h-full" />
        )}
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#1E372B] backdrop-blur sm:left-3 sm:top-3 sm:px-2.5">
          Best Seller
        </span>
        <button
          type="button"
          aria-label="Add to wishlist"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toast("Wishlist coming soon");
          }}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#1E372B] backdrop-blur transition hover:scale-105 sm:right-3 sm:top-3"
        >
          <Heart size={15} />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-0.5 pb-0.5 pt-3 sm:px-1 sm:pt-3.5">
        <div>
          <h3 className="line-clamp-2 min-h-[38px] font-serif text-sm font-medium leading-tight text-[#1E372B] sm:min-h-[44px] sm:text-base lg:text-lg">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-1 text-[11px] leading-4 text-[#6D736C] sm:text-xs">
            {benefit}
          </p>
        </div>
        <div className="mt-2 flex items-center gap-1.5 sm:mt-3">
          <div className="flex items-center gap-0.5 text-[#4A6456]">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                size={11}
                className={rating && index < Math.round(rating) ? "fill-current" : "text-[#C2C8C2]"}
              />
            ))}
          </div>
          <span className="text-[10px] text-[#727974] sm:text-xs">
            {rating ? rating.toFixed(1) : "New"} ({reviewCount})
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:mt-3 sm:gap-2">
          <p className="text-sm font-semibold text-[#1E372B] sm:text-base">
            {currency}
            {Number(product.price).toLocaleString()}
          </p>
          <p className="text-[11px] text-[#9A9F99] line-through sm:text-xs">
            {currency}
            {Number(originalPrice).toLocaleString()}
          </p>
          <span className="rounded-full bg-[#D7E5BB] px-2 py-0.5 text-[9px] font-semibold text-[#344E41] sm:text-[10px]">
            {discount}% OFF
          </span>
        </div>
        <div className="mt-auto pt-3">
          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full min-h-9 rounded-full bg-[#344E41] px-3 text-xs font-semibold text-white transition hover:bg-[#1E372B] sm:min-h-10 sm:text-sm"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </Link>
  );
}

function ProductShowcase({ products }) {
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const currency = getCurrency();
  const items = useMemo(
    () => {
      const realProducts = products.slice(0, 4).map((product) => ({
        label: product.category || "Featured Product",
        title: product.name,
        description: product.description || "Premium hair care designed for a consistent daily routine.",
        image: product.images?.[0] || assets.KsShampoo,
        imageFit: "contain",
        metric: product.category || "Hair care",
        price: product.price,
        href: `/product/${product.id}`,
      }));
      const placeholders = productShowcase.slice(realProducts.length, 4).map((item) => ({
        ...item,
        price: item.fallbackPrice,
        href: "/shop",
      }));

      return [...realProducts, ...placeholders];
    },
    [products]
  );
  const activeItem = items[active];
  const price = activeItem?.price || 1499;

  useEffect(() => {
    if (isPaused) return undefined;

    const timer = setInterval(() => {
      setActive((current) => (current + 1) % items.length);
    }, 6500);

    return () => clearInterval(timer);
  }, [isPaused, items.length]);

  const goToSlide = (nextIndex) => {
    setActive((nextIndex + items.length) % items.length);
  };

  return (
    <section className="bg-[#1E372B] px-3 py-10 text-white md:px-8 md:py-16 lg:px-16">
      <div
        className="mx-auto max-w-[1440px]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#FCF9F8] text-[#1E372B] shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
          <div className="grid lg:min-h-[500px] lg:grid-cols-[55%_45%]">
            <div className="relative aspect-[16/11] overflow-hidden bg-[#F6F3F2] md:aspect-auto md:min-h-[390px] lg:min-h-[500px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeItem.label}-image`}
                  initial={{ opacity: 0, scale: 1.015 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.99 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                  className="absolute inset-0"
                >
                  <Image
                    src={activeItem.image}
                    alt={activeItem.title}
                    fill
                    className={
                      activeItem.imageFit === "cover"
                        ? "object-contain p-5 md:object-cover md:p-0"
                        : "object-contain p-5 md:p-12 lg:p-14"
                    }
                    sizes="(max-width: 1024px) 100vw, 55vw"
                  />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_35%,rgba(215,229,187,0.28),transparent_42%)]" />
                </motion.div>
              </AnimatePresence>

              <button
                type="button"
                aria-label="Previous showcase slide"
                onClick={() => goToSlide(active - 1)}
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#1E372B] shadow-sm backdrop-blur transition hover:bg-white md:left-5"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                aria-label="Next showcase slide"
                onClick={() => goToSlide(active + 1)}
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#1E372B] shadow-sm backdrop-blur transition hover:bg-white md:right-5"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="flex flex-col justify-center px-5 py-6 md:px-10 lg:min-h-[500px] lg:px-14 lg:py-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeItem.label}-content`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#566342]">
                    {activeItem.label}
                  </p>
                  <h2 className="mt-2.5 line-clamp-2 max-w-xl font-serif text-[28px] font-medium leading-[1.08] text-[#1E372B] md:mt-4 md:text-4xl lg:text-[44px]">
                    {activeItem.title}
                  </h2>
                  <p className="mt-3 line-clamp-4 max-w-md text-sm leading-6 text-[#5F665F] md:mt-4 md:text-base md:leading-7">
                    {activeItem.description}
                  </p>

                  <div className="mt-5 grid max-w-md grid-cols-2 gap-3 border-y border-[#E5E2E1] py-3.5 md:mt-7 md:py-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#727974]">
                        Focus
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#1E372B]">{activeItem.metric}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#727974]">
                        Price
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#1E372B]">
                        {currency}
                        {Number(price).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 md:mt-5">
                    <Link
                      href={activeItem.href}
                      className="inline-flex min-h-[50px] w-full items-center justify-center rounded-full bg-[#344E41] px-6 text-sm font-semibold text-white transition hover:bg-[#1E372B] sm:w-auto md:min-h-11"
                    >
                      View Product
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ResearchJourney() {
  const sectionRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frameId = null;

    const updateProgress = () => {
      if (frameId) return;

      frameId = window.requestAnimationFrame(() => {
        const section = sectionRef.current;
        if (!section) {
          frameId = null;
          return;
        }

        const rect = section.getBoundingClientRect();
        const start = window.innerHeight * 0.72;
        const end = -rect.height * 0.12;
        const nextProgress = Math.min(1, Math.max(0, (start - rect.top) / (start - end)));

        setProgress((current) => Math.max(current, nextProgress));
        frameId = null;
      });
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="development-process"
      className="bg-[#F6F3F2] px-5 py-12 md:px-10 md:py-16 lg:px-20"
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#566342]"
          >
            RESEARCH JOURNEY
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.48, delay: 0.2, ease: "easeOut" }}
            className="mt-3 font-serif text-3xl font-medium leading-tight text-[#1E372B] sm:text-4xl lg:text-5xl"
          >
            Every product follows a research-first process.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.48, delay: 0.4, ease: "easeOut" }}
            className="mt-4 text-sm leading-7 text-[#5F665F] sm:text-base"
          >
            From the first idea to continuous improvement, every step is designed with quality, transparency and customer trust in mind.
          </motion.p>
        </div>

        <div className="mt-10 hidden overflow-x-auto pb-3 [scrollbar-width:none] md:block [&::-webkit-scrollbar]:hidden">
          <div className="relative grid min-w-[1120px] grid-cols-8 gap-4 px-1 pt-7">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: 0.7, ease: "easeOut" }}
              className="absolute left-[7%] right-[7%] top-[27px] h-[3px] origin-left rounded-full bg-[#BCC6BD]"
            >
              <div
                className="h-full origin-left rounded-full bg-[#344E41] transition-transform duration-500 ease-out"
                style={{ transform: `scaleX(${progress})` }}
              />
            </motion.div>

            {processSteps.map((step, index) => {
              const threshold = index / (processSteps.length - 1);
              const isActive = progress >= Math.max(0, threshold - 0.015);
              const isLast = index === processSteps.length - 1;

              return (
                <motion.div
                  key={step.title}
                  animate={isActive ? { y: -6 } : { y: 0 }}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={`group relative flex min-h-[188px] flex-col items-center rounded-[20px] border px-4 pb-5 pt-9 text-center transition-all duration-300 ${
                    isActive
                      ? "border-[#C2C8C2] bg-white shadow-[0_18px_44px_rgba(30,55,43,0.09)]"
                      : "border-[#E5E2E1] bg-[#FCF9F8] shadow-[0_12px_30px_rgba(30,55,43,0.035)]"
                  }`}
                >
                  <div
                    className={`absolute -top-[19px] left-1/2 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border transition-all duration-300 ${
                      isActive
                        ? "border-[#344E41] bg-[#E9F0D8] shadow-[0_0_0_6px_rgba(52,78,65,0.08)]"
                        : "border-[#C2C8C2] bg-[#F6F3F2]"
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full transition-colors duration-300 ${
                        isActive ? "bg-[#344E41]" : "bg-[#8B938C]"
                      }`}
                    />
                  </div>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-[#344E41] transition-all duration-300 ${
                      isActive ? "scale-[1.05] bg-[#D7E5BB] opacity-100" : "bg-[#E9F0D8] opacity-70"
                    } ${isLast ? "animate-[researchPulse_5.5s_ease-in-out_infinite]" : ""}`}
                  >
                    <step.icon
                      size={19}
                      className={isLast ? "animate-[researchRotate_12s_linear_infinite]" : ""}
                    />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold leading-snug text-[#1E372B]">
                    {step.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#6D736C]">
                    {step.description}
                  </p>
                  {isLast && (
                    <span className="mt-auto pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#566342]">
                      Ongoing
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="relative mt-9 md:hidden">
          <div className="absolute bottom-8 left-[18px] top-2 w-[3px] rounded-full bg-[#BCC6BD]" />
          <div
            className="absolute bottom-8 left-[18px] top-2 w-[3px] origin-top rounded-full bg-[#344E41] transition-transform duration-500 ease-out"
            style={{ transform: `scaleY(${progress})` }}
          />
          <div className="grid gap-4">
            {processSteps.map((step, index) => {
              const threshold = index / (processSteps.length - 1);
              const isActive = progress >= Math.max(0, threshold - 0.015);
              const isLast = index === processSteps.length - 1;

              return (
                <motion.div
                  key={step.title}
                  animate={isActive ? { y: -4 } : { y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="relative grid grid-cols-[40px_1fr] gap-3"
                >
                  <div
                    className={`relative z-10 mt-5 flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 ${
                      isActive
                        ? "border-[#344E41] bg-[#E9F0D8] shadow-[0_0_0_6px_rgba(52,78,65,0.08)]"
                        : "border-[#C2C8C2] bg-[#F6F3F2]"
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full transition-colors duration-300 ${
                        isActive ? "bg-[#344E41]" : "bg-[#8B938C]"
                      }`}
                    />
                  </div>
                  <div
                    className={`flex min-h-[132px] flex-col rounded-[18px] border px-4 py-4 transition-all duration-300 ${
                      isActive
                        ? "border-[#C2C8C2] bg-white shadow-[0_16px_38px_rgba(30,55,43,0.09)]"
                        : "border-[#E5E2E1] bg-[#FCF9F8] shadow-[0_10px_26px_rgba(30,55,43,0.035)]"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-[#344E41] transition-all duration-300 ${
                        isActive ? "scale-[1.05] bg-[#D7E5BB] opacity-100" : "bg-[#E9F0D8] opacity-75"
                      } ${isLast ? "animate-[researchPulse_5.5s_ease-in-out_infinite]" : ""}`}
                    >
                      <step.icon
                        size={18}
                        className={isLast ? "animate-[researchRotate_12s_linear_infinite]" : ""}
                      />
                    </div>
                    <h3 className="mt-3 text-sm font-semibold leading-snug text-[#1E372B]">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-[#6D736C]">
                      {step.description}
                    </p>
                    {isLast && (
                      <span className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#566342]">
                        Ongoing
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomepageExperience({ products = [] }) {
  const manuallySelectedBestSellers = products.filter((product) => product.content?.isBestSeller);
  const bestSellers = (manuallySelectedBestSellers.length > 0 ? manuallySelectedBestSellers : products)
    .slice()
    .sort((a, b) => {
      if (a.content?.isBestSeller !== b.content?.isBestSeller) {
        return a.content?.isBestSeller ? -1 : 1;
      }

      return (b.rating?.length || 0) - (a.rating?.length || 0);
    })
    .slice(0, 4);

  return (
    <main className="overflow-hidden bg-[#FCF9F8] text-[#1B1B1C]">
      <HeroCarousel />
      <TrustStrip />

      <section className="mx-auto max-w-[1440px] px-5 py-10 md:px-10 md:py-16 lg:px-20">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-serif text-2xl font-medium leading-tight text-[#1E372B] md:text-4xl">
            Shop By Concern
          </h2>
          <p className="mt-2 text-xs leading-5 text-[#5F665F] md:text-sm">
            Choose the concern you want to care for first.
          </p>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {concerns.map((concern) => (
            <motion.div
              key={concern.title}
              whileTap={{ scale: 0.98 }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25 }}
            >
              <Link
                href={concern.href}
                className="group relative block aspect-square overflow-hidden rounded-[18px] bg-[#1E372B] shadow-[0_14px_34px_rgba(30,55,43,0.11)] sm:rounded-[22px]"
              >
                <Image
                  src={concern.image}
                  alt={`${concern.title} concern`}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(30,55,43,0.02)_0%,rgba(30,55,43,0.08)_48%,rgba(13,23,18,0.84)_100%)]" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-white sm:p-4">
                  <h3 className="font-serif text-base font-medium leading-tight sm:text-xl">
                    {concern.title}
                  </h3>
                  <p className="mt-1 line-clamp-1 text-[11px] font-medium leading-4 text-white/76 sm:text-xs">
                    {concern.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-10 md:px-10 md:py-16 lg:px-20">
        <div className="flex flex-row items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#566342] md:text-[11px]">
              Best sellers
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-[#1E372B] md:text-4xl">
              Customer favourites.
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#5F665F]">
              Premium picks with clear pricing and quick add.
            </p>
          </div>
          <Link
            href="/shop"
            className="hidden min-h-10 w-fit items-center gap-2 rounded-full bg-[#344E41] px-5 text-sm font-semibold text-white transition hover:bg-[#1E372B] sm:inline-flex"
          >
            Shop All <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {bestSellers.length > 0 ? (
            bestSellers.map((product) => <ProductCard key={product.id} product={product} />)
          ) : (
            Array.from({ length: 4 }).map((_, index) => (
              <PlaceholderImage
                key={index}
                label="Product pending"
                className="min-h-[355px] rounded-[18px] sm:min-h-[395px] sm:rounded-[22px] lg:min-h-[435px]"
              />
            ))
          )}
        </div>
        <Link
          href="/shop"
          className="mx-auto mt-6 inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#344E41] px-5 text-sm font-semibold text-white transition hover:bg-[#1E372B] sm:hidden"
        >
          Shop All <ArrowRight size={15} />
        </Link>
      </section>

      <ProductShowcase products={bestSellers} />

      <section className="mx-auto max-w-[1440px] px-5 py-11 md:px-10 md:py-16 lg:px-20">
        <SectionIntro
          eyebrow="WHY CUSTOMERS TRUST US"
          title="Why Customers Choose K-SARWAR"
          align="center"
        />
        <div className="mt-8 grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-4">
          {chooseItems.map((item) => (
            <motion.div
              key={item.title}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="group flex h-full min-h-[220px] flex-col items-center rounded-[24px] border border-[#E5E2E1] bg-[#FCF9F8] px-5 py-7 text-center shadow-[0_12px_34px_rgba(30,55,43,0.04)] transition-shadow duration-300 hover:shadow-[0_20px_48px_rgba(30,55,43,0.1)]"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#D7E5BB] text-[#344E41] transition-colors duration-300 group-hover:bg-[#E3EFC7]">
                <item.icon size={22} />
              </div>
              <h3 className="mt-5 font-serif text-xl font-medium leading-tight text-[#1E372B]">
                {item.title}
              </h3>
              <p className="mx-auto mt-3 line-clamp-2 max-w-[250px] text-sm leading-6 text-[#6D736C]">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="w-full bg-[#FCF9F8]">
        <div className="mx-auto max-w-3xl px-5 py-12 text-center md:px-10 md:py-16">
          <h2 className="font-serif text-3xl font-medium leading-tight text-[#1E372B] md:text-5xl">
            The Ingredients Behind the Formula
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#5F665F] md:text-base">
            Thoughtfully selected botanicals, brought together through research.
          </p>
        </div>
        <div className="grid gap-6 md:gap-7 lg:gap-8">
          {ingredientBanners.map((ingredient, index) => (
            <motion.article
              key={ingredient.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.52, delay: index * 0.05, ease: "easeOut" }}
              className="overflow-hidden bg-[#FCF9F8]"
            >
              <Image
                src={ingredient.mobileImage}
                alt={`${ingredient.name} ingredient banner`}
                className="block h-auto w-full md:hidden"
                sizes="100vw"
              />
              <Image
                src={ingredient.tabletImage}
                alt={`${ingredient.name} ingredient banner`}
                className="hidden h-auto w-full md:block lg:hidden"
                sizes="100vw"
              />
              <Image
                src={ingredient.desktopImage}
                alt={`${ingredient.name} ingredient banner`}
                className="hidden h-auto w-full lg:block"
                sizes="100vw"
              />
            </motion.article>
          ))}
        </div>
      </section>

      <ResearchJourney />

      <CommunityReelsShowcase />

      <section className="bg-[#1E372B] px-6 py-14 text-white md:px-10 md:py-20 lg:px-20">
        <div className="mx-auto max-w-[1440px]">
          <SectionIntro
            eyebrow="Reviews"
            title="Stories from real routines."
            description="Verified feedback will appear here as the catalog grows."
            tone="dark"
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {customerStories.map((story) => (
              <article key={story.name} className="rounded-[28px] border border-white/15 bg-white/8 p-6">
                <Quote className="h-7 w-7 text-[#D7E5BB]" />
                <p className="mt-5 text-sm leading-7 text-white/82">{story.quote}</p>
                <p className="mt-6 font-serif text-xl font-medium">{story.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#B0CDBC]">
                  {story.location} | {story.product}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-8 px-6 py-14 md:px-10 md:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:px-20">
        <SectionIntro
          eyebrow="FAQ"
          title="Questions customers ask before they shop."
          description="Simple objection handling, without medical promises."
        />
        <div className="divide-y divide-[#E5E2E1] rounded-[28px] border border-[#E5E2E1] bg-[#F6F3F2]">
          {faqs.map((faq) => (
            <details key={faq.question} className="group p-5 open:bg-white/60">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-[#1E372B]">
                {faq.question}
                <ChevronRight className="h-5 w-5 shrink-0 transition group-open:rotate-90" />
              </summary>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6D736C]">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-[#F6F3F2] px-6 py-14 md:px-10 md:py-20 lg:px-20">
        <div className="mx-auto grid max-w-[1440px] gap-8 rounded-[30px] bg-[#1E372B] p-8 text-white md:p-10 lg:grid-cols-[1fr_0.9fr] lg:p-14">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#B0CDBC]">
              Newsletter
            </p>
            <h2 className="mt-4 font-serif text-3xl font-medium leading-tight sm:text-4xl">
              Product updates, care education, and launch notes.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/78">
              Join the K-SARWAR list for new launches and calm product education.
            </p>
          </div>
          <form className="flex flex-col justify-center gap-3">
            <label htmlFor="homepage-newsletter" className="sr-only">
              Email address
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="homepage-newsletter"
                type="email"
                placeholder="Enter your email"
                className="min-h-12 flex-1 rounded-full border border-white/20 bg-white/10 px-5 text-sm text-white outline-none placeholder:text-white/60 focus:border-[#D7E5BB]"
              />
              <button
                type="button"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#1E372B] transition hover:-translate-y-0.5"
              >
                Join List <Mail size={16} />
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
