import { Outfit } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";
import StoreProvider from "@/app/StoreProvider";
import { absoluteUrl, getBaseUrl, siteConfig } from "@/lib/site";
import PostHogBoot from "@/components/analytics/PostHogBoot";
import MetaPixelBoot from "@/components/analytics/MetaPixelBoot";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    type: "website",
    url: absoluteUrl("/"),
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  verification: {
    other: {
      "msvalidate.01": "3E14DD25EB9BB7CFC1261B740CC93E28",
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <Script id="google-tag-manager" strategy="beforeInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-P3BFS9ND');
            `}
          </Script>
        </head>
        <body className={`${outfit.className} antialiased`}>
          <noscript>
            <iframe
              src="https://www.googletagmanager.com/ns.html?id=GTM-P3BFS9ND"
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
          <Script
            src="https://checkout.razorpay.com/v1/checkout.js"
            strategy="beforeInteractive"
          />
          <StoreProvider>
            <Toaster />
            <Suspense fallback={null}>
              <PostHogBoot />
              <MetaPixelBoot />
            </Suspense>
            {children}
          </StoreProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
