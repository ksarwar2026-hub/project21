import { Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import StoreProvider from "@/app/StoreProvider";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata = {
    title: "K-Sarwar – Research Lab",
    description: "K-Sarwar is a medical research lab and ecommerce platform for authentic homeopathic medicines.",

    // ✅ SEO robots settings (Google snippet allow)
    robots: {
    index: true,
    follow: true,
        googleBot: {
        index: true,
        follow: true,
        },
    },
};

export default function RootLayout({ children }) {
    return (
        <ClerkProvider>
            <html lang="en">
                <body className={`${outfit.className} antialiased`}>
                    <StoreProvider>
                        <Toaster />
                        {children}
                    </StoreProvider>
                </body>
            </html>
        </ClerkProvider>
    );
}
