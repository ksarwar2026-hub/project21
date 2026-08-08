'use client'

import {
  CreditCard,
  Home,
  Info,
  Menu,
  PackageIcon,
  Search,
  ShoppingBag,
  ShoppingCart,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSelector } from "react-redux";
import { Protect, UserButton, useClerk, useUser } from "@clerk/nextjs";
import Image from "next/image";
import { assets } from "@/assets/assets";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import { useAnalytics } from "@/lib/posthog/useAnalytics";
import { POSTHOG_EVENTS } from "@/lib/posthog/config";

const navLinks = [
  { label: "Shop All", href: "/shop" },
  { label: "Collections", href: "/shop?search=hair" },
  { label: "Research", href: "/#development-process" },
  { label: "About", href: "/about" },
];

const Navbar = () => {
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const router = useRouter();
  const { capture } = useAnalytics();
  const cartCount = useSelector((state) => state.cart.total);

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const handleSignIn = (navType) => {
    capture(POSTHOG_EVENTS.SIGN_IN_CTA_CLICKED, {
      action: "sign_in_cta_clicked",
      nav_type: navType,
    });
    openSignIn();
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-[#E5E2E1]/80 bg-[#FCF9F8]/85 shadow-sm backdrop-blur-md">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-20">
        <div className="grid min-h-20 grid-cols-[auto_1fr_auto] items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setShowMobileMenu(true)}
              className="rounded-full p-2 text-[#1E372B] transition hover:bg-[#F0EDED] md:hidden"
            >
              <Menu size={22} />
            </button>

            <div className="hidden items-center gap-7 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm font-semibold text-[#424844] transition hover:text-[#1E372B]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <Link href="/" className="relative mx-auto flex items-center justify-center">
            <Image
              src={assets.KlogoFinalB}
              alt="K-SARWAR Logo"
              width={142}
              height={40}
              className="h-auto w-[124px] object-contain md:w-[142px]"
              priority
            />
            <Protect condition={(has) => has({ plan: "plus" })}>
              <span className="absolute -right-6 -top-2 rounded-full bg-[#344E41] px-2 py-0.5 text-[10px] font-semibold leading-none text-white">
                plus
              </span>
            </Protect>
          </Link>

          <div className="flex items-center justify-end gap-2 sm:gap-3">
            <SearchAutocomplete className="hidden w-[300px] xl:block" />

            <button
              type="button"
              aria-label="Search products"
              onClick={() => setShowMobileSearch((prev) => !prev)}
              className="rounded-full p-2 text-[#1E372B] transition hover:bg-[#F0EDED] xl:hidden"
            >
              <Search size={21} />
            </button>

            <Link
              href="/cart"
              aria-label="Cart"
              className="relative rounded-full p-2 text-[#1E372B] transition hover:bg-[#F0EDED]"
            >
              <ShoppingBag size={21} />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#4A6456] px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {!user ? (
              <button
                onClick={() => handleSignIn("desktop")}
                className="hidden min-h-10 items-center rounded-full bg-[#344E41] px-5 text-sm font-semibold text-white transition hover:bg-[#1E372B] sm:inline-flex"
              >
                Login
              </button>
            ) : (
              <UserButton>
                <UserButton.MenuItems>
                  <UserButton.Action
                    labelIcon={<PackageIcon size={16} />}
                    label="My Orders"
                    onClick={() => router.push("/orders")}
                  />
                  <UserButton.Action
                    labelIcon={<CreditCard size={16} />}
                    label="Membership"
                    onClick={() => router.push("/pricing")}
                  />
                </UserButton.MenuItems>
              </UserButton>
            )}
          </div>
        </div>

        {showMobileSearch && (
          <div className="pb-4 xl:hidden">
            <SearchAutocomplete
              isMobile
              className="w-full"
              onNavigate={() => setShowMobileSearch(false)}
            />
          </div>
        )}
      </div>

      {showMobileMenu && (
        <div className="fixed inset-0 z-[70] md:hidden">
          <button
            type="button"
            aria-label="Close menu overlay"
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="relative flex h-full w-[min(84vw,320px)] flex-col rounded-r-[28px] bg-[#FCF9F8] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="font-serif text-2xl font-medium tracking-wide text-[#1E372B]">
                K-SARWAR
              </span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setShowMobileMenu(false)}
                className="rounded-full p-2 text-[#424844] hover:bg-[#F0EDED]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-8 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setShowMobileMenu(false)}
                  className="rounded-2xl px-4 py-3 text-base font-semibold text-[#424844] transition hover:bg-[#F0EDED] hover:text-[#1E372B]"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/cart"
                onClick={() => setShowMobileMenu(false)}
                className="mt-2 flex items-center gap-3 rounded-2xl bg-[#D7E5BB] px-4 py-3 text-base font-semibold text-[#344E41]"
              >
                <ShoppingCart size={18} />
                Cart
              </Link>

              {!user && (
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    handleSignIn("mobile");
                  }}
                  className="mt-3 min-h-11 rounded-full bg-[#344E41] px-5 text-sm font-semibold text-white"
                >
                  Login
                </button>
              )}

              {user && (
                <div className="mt-3 grid gap-2 border-t border-[#E5E2E1] pt-4">
                  {[
                    ["Home", Home, "/"],
                    ["Shop", ShoppingCart, "/shop"],
                    ["About", Info, "/about"],
                    ["My Orders", PackageIcon, "/orders"],
                    ["Membership", CreditCard, "/pricing"],
                  ].map(([label, Icon, href]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        setShowMobileMenu(false);
                        router.push(href);
                      }}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-[#424844] hover:bg-[#F0EDED]"
                    >
                      <Icon size={17} />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
