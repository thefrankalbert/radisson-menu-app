import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import CartSummary from "@/components/CartSummary";
import MenuVisitedTracker from "@/components/MenuVisitedTracker";
import { CartProvider } from "@/context/CartContext";
import { LanguageProvider } from "@/context/LanguageContext";
import BottomNav from "@/components/BottomNav";
import InstallPrompt from "@/components/InstallPrompt";
import ToastProvider from "@/components/ToastProvider";
import OfflineIndicator from "@/components/OfflineIndicator";

export const runtime = 'edge';

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Radisson Blu E-Menu",
  description: "Digital menu for Radisson Blu Hotel",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Radisson Menu",
  },
};

export const viewport: Viewport = {
  themeColor: "#003366",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${montserrat.className} bg-radisson-light antialiased pb-24`}>
        <LanguageProvider>
          <CartProvider>
            <MenuVisitedTracker />
            <Header />
            {children}
            <CartSummary />
            <BottomNav />
            <InstallPrompt />
            <OfflineIndicator />
            <ToastProvider />
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
