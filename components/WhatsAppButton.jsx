import Image from "next/image";
import { assets } from "@/assets/assets";
import { getWhatsAppUrl } from "@/lib/whatsapp";

const WhatsAppButton = () => {
  return (
    <a
      href={getWhatsAppUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with K-SARWAR on WhatsApp"
      className="group fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-4 z-[65] flex h-14 w-14 items-center justify-center rounded-full border border-white/80 bg-white shadow-[0_16px_36px_rgba(30,55,43,0.22)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(30,55,43,0.28)] focus:outline-none focus:ring-4 focus:ring-[#344E41]/20 sm:bottom-6 sm:right-6 sm:h-16 sm:w-16"
    >
      <span className="pointer-events-none absolute right-[calc(100%+12px)] hidden whitespace-nowrap rounded-full bg-[#1E372B] px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-lg transition duration-300 group-hover:opacity-100 sm:block">
        Chat with us
      </span>
      <Image
        src={assets.whatsapp}
        alt=""
        width={44}
        height={44}
        className="h-10 w-10 object-contain sm:h-11 sm:w-11"
      />
    </a>
  );
};

export default WhatsAppButton;
