import type { Metadata } from "next";
import { Oswald, Roboto } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";
import { CartProvider } from "@/context/CartContext";
import ChatWrapper from "@/components/Chatbot/ChatWrapper";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${oswald.variable} ${roboto.variable}`} suppressHydrationWarning>
      <body>
        <ChatWrapper>
          <Toaster position="top-center" />

          <CartProvider>
            <Header />
            <main style={{ minHeight: "70vh" }}>{children}</main>
            <Footer />
          </CartProvider>
        </ChatWrapper>
      </body>
    </html>
  );
}

/* 
  We separate chat into a client-only wrapper 
  so RootLayout stays server component compliant.
*/
