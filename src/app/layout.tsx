import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";
import { CartProvider } from "@/context/CartContext";

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
    <html lang="en">
      <body>
        {/* Global Toast System */}
        <Toaster position="top-center" />

        {/* Cart Context Provider */}
        <CartProvider>

          {/* Header */}
          <Header />

          {/* Main Page Content */}
          <main>{children}</main>

          {/* Footer */}
          <Footer />

        </CartProvider>
      </body>
    </html>
  );
}
