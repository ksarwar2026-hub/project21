'use client'

import {
  PackageIcon,
  Search,
  ShoppingCart,
  Home,
  Info,
  Phone,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useUser, useClerk, UserButton, Protect } from "@clerk/nextjs";
import Image from "next/image";
import { assets } from "@/assets/assets";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import { useAnalytics } from "@/lib/posthog/useAnalytics";
import { POSTHOG_EVENTS } from "@/lib/posthog/config";

const Navbar = () => {
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const router = useRouter();
  const { capture } = useAnalytics();

  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const cartCount = useSelector((state) => state.cart.total);

  return (
    <nav className="relative bg-white">
      <div className="mx-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto py-4 transition-all">
          <Link href="/" className="relative flex items-center font-semibold text-slate-700 leading-none">
            <Image
              src={assets.KlogoFinalB}
              alt="K-Sarwar Logo"
              width={135}
              height={36}
              className="block object-contain"
              priority
            />

            <Protect condition={(has) => has({ plan: "plus" })}>
              <span className="absolute -top-1 -right-6 text-[10px] font-semibold px-2 py-0.5 rounded-full text-white bg-green-500 leading-none">
                plus
              </span>
            </Protect>
          </Link>

          <div className="hidden sm:flex items-center gap-4 lg:gap-8 text-slate-600">
            <Link href="/">Home</Link>
            <Link href="/shop">Shop</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>

            <SearchAutocomplete className="hidden xl:block w-[360px]" />

            <Link href="/cart" className="relative flex items-center gap-2 text-slate-600">
              <ShoppingCart size={18} />
              Cart
              {cartCount > 0 && (
                <button className="absolute -top-1 left-3 text-[8px] text-white bg-slate-600 size-3.5 rounded-full">
                  {cartCount}
                </button>
              )}
            </Link>

            {!user ? (
              <button
                onClick={() => {
                  capture(POSTHOG_EVENTS.SIGN_IN_CTA_CLICKED, {
                    action: "sign_in_cta_clicked",
                    nav_type: "desktop",
                  });
                  openSignIn();
                }}
                className="px-8 py-2 bg-indigo-500 hover:bg-indigo-600 transition text-white rounded-full"
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
                    label="Subscription"
                    onClick={() => router.push("/subscription")}
                  />
                </UserButton.MenuItems>
              </UserButton>
            )}
          </div>

          <div className="sm:hidden flex items-center gap-4">
            <button onClick={() => setShowMobileSearch((prev) => !prev)}>
              <Search size={22} />
            </button>

            <Link href="/cart" className="relative">
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-2 text-[10px] bg-slate-600 text-white w-4 h-4 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            {!user ? (
              <button
                onClick={() => {
                  capture(POSTHOG_EVENTS.SIGN_IN_CTA_CLICKED, {
                    action: "sign_in_cta_clicked",
                    nav_type: "mobile",
                  });
                  openSignIn();
                }}
                className="px-6 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-sm transition text-white rounded-full"
              >
                Login
              </button>
            ) : (
              <UserButton>
                <UserButton.MenuItems>
                  <UserButton.Action
                    labelIcon={<Home size={16} />}
                    label="Home"
                    onClick={() => router.push("/")}
                  />
                  <UserButton.Action
                    labelIcon={<ShoppingCart size={16} />}
                    label="Shop"
                    onClick={() => router.push("/shop")}
                  />
                  <UserButton.Action
                    labelIcon={<Info size={16} />}
                    label="About"
                    onClick={() => router.push("/about")}
                  />
                  <UserButton.Action
                    labelIcon={<Phone size={16} />}
                    label="Contact"
                    onClick={() => router.push("/contact")}
                  />
                  <UserButton.Action
                    labelIcon={<PackageIcon size={16} />}
                    label="My Orders"
                    onClick={() => router.push("/orders")}
                  />
                  <UserButton.Action
                    labelIcon={<CreditCard size={16} />}
                    label="Subscription"
                    onClick={() => router.push("/subscription")}
                  />
                </UserButton.MenuItems>
              </UserButton>
            )}
          </div>
        </div>

        {showMobileSearch && (
          <div className="sm:hidden pb-4">
            <SearchAutocomplete
              isMobile={true}
              className="w-full"
              onNavigate={() => setShowMobileSearch(false)}
            />
          </div>
        )}
      </div>

      <hr className="border-gray-300" />
    </nav>
  );
};

export default Navbar;
