import Image from "next/image";
import Link from "next/link";
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Twitter,
} from "lucide-react";
import { assets } from "@/assets/assets";

const footerSections = [
  {
    title: "Shop",
    links: [
      { text: "All Products", path: "/shop" },
      { text: "Hair Care", path: "/shop?search=hair" },
      { text: "Scalp Care", path: "/shop?search=scalp" },
      { text: "Personal Care", path: "/shop?search=personal" },
      { text: "New Arrivals", path: "/shop" },
    ],
  },
  {
    title: "Company",
    links: [
      { text: "About K-SARWAR", path: "/about" },
      { text: "Become a Distributor", path: "/create-store" },
      { text: "Membership", path: "/pricing" },
      { text: "My Orders", path: "/orders" },
      { text: "Cart", path: "/cart" },
    ],
  },
  {
    title: "Policies",
    links: [
      { text: "Privacy Policy", path: "/privacy-policy" },
      { text: "Terms & Conditions", path: "/terms&condition" },
      { text: "Return & Refund", path: "/return&refund" },
    ],
  },
];

const contactItems = [
  { text: "+91-735 232 6331", icon: Phone, href: "tel:+917352326331" },
  { text: "contact@ksarwar.in", icon: Mail, href: "mailto:contact@ksarwar.in" },
  { text: "Sitanabad, Saharsa, Bihar 852106", icon: MapPin, href: "/" },
];

const socialItems = [
  {
    label: "Facebook",
    icon: Facebook,
    href: "https://www.facebook.com/share/1EsPwxUzaf/",
  },
  {
    label: "Instagram",
    icon: Instagram,
    href: "https://www.instagram.com/k_sarwar_?igsh=YmRneDI5d3o5Nnl5",
  },
  { label: "Twitter", icon: Twitter, href: "https://twitter.com" },
  { label: "LinkedIn", icon: Linkedin, href: "https://www.linkedin.com" },
];

const Footer = () => {
  return (
    <footer className="bg-[#14231B] px-4 text-[#F8F4EA] sm:px-6">
      <div className="mx-auto max-w-7xl py-14">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1.4fr]">
          <div>
            <Link href="/" className="inline-flex items-center">
              <Image
                src={assets.KlogoFinalB}
                alt="K-SARWAR Logo"
                width={150}
                height={40}
                className="h-auto w-[150px] rounded bg-[#F8F4EA] p-2"
              />
            </Link>
            <p className="mt-6 max-w-md text-sm leading-7 text-[#D9D0B9]">
              K-SARWAR creates a clearer shopping experience for daily care
              products, with a focus on transparency, quality communication, and
              customer confidence.
            </p>
            <div className="mt-6 flex items-center gap-2 rounded-lg border border-[#F8F4EA]/15 bg-white/5 p-4 text-sm text-[#EFE5CB]">
              <ShieldCheck className="h-5 w-5 shrink-0 text-[#D8BD78]" />
              <span>Secure shopping, visible policies, and support after purchase.</span>
            </div>
            <div className="mt-6 flex gap-3">
              {socialItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-label={item.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F8F4EA]/15 text-[#EFE5CB] transition hover:border-[#D8BD78] hover:text-[#D8BD78]"
                >
                  <item.icon size={18} />
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D8BD78]">
                  {section.title}
                </h3>
                <ul className="mt-5 space-y-3 text-sm text-[#D9D0B9]">
                  {section.links.map((link) => (
                    <li key={link.text}>
                      <Link href={link.path} className="transition hover:text-[#F8F4EA]">
                        {link.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D8BD78]">
                Contact
              </h3>
              <ul className="mt-5 space-y-3 text-sm text-[#D9D0B9]">
                {contactItems.map((item) => (
                  <li key={item.text}>
                    <Link href={item.href} className="flex gap-2 transition hover:text-[#F8F4EA]">
                      <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-[#D8BD78]" />
                      <span>{item.text}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[#F8F4EA]/15 pt-6 text-xs text-[#D9D0B9] sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright 2026 K-SARWAR. All rights reserved.</p>
          <p>Product information is provided for general shopping guidance.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
