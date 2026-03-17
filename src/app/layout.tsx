import type { Metadata } from "next";
import { Oswald, Roboto } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import TopHeader from "@/components/TopHeader";
import BottomHeader from "@/components/BottomHeader";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";
import { CartProvider } from "@/context/CartContext";
import ChatWrapper from "@/components/Chatbot/ChatWrapper";
import { AuthProvider } from "@/context/AuthContext";

const oswald = Oswald({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heading",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Supplement Store",
  description: "Your trusted source for fitness supplements in Sri Lanka",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${oswald.variable} ${roboto.variable}`} suppressHydrationWarning>
      <body className="font-body bg-black text-white antialiased">
        <AuthProvider>
          <CartProvider>
            <Toaster position="top-center" />
            
            <header className="w-full bg-black">
              <TopHeader />
              <Suspense fallback={<div className="h-[88px] w-full rounded-t-[36px] bg-white" />}>
                <BottomHeader />
              </Suspense>
            </header>

            <main className="min-h-[70vh] flex flex-col">
              {children}
            </main>

            <Footer />
            <ChatWrapper />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
