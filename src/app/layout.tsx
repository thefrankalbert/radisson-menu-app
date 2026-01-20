import type { Metadata, Viewport } from "next";
import { Montserrat, Playfair_Display } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Header from "@/components/Header";
import CartSummary from "@/components/CartSummary";
import MenuVisitedTracker from "@/components/MenuVisitedTracker";
import { CartProvider } from "@/context/CartContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { VenueProvider } from "@/contexts/VenueContext";
import BottomNav from "@/components/BottomNav";
import InstallPrompt from "@/components/InstallPrompt";
import ToastProvider from "@/components/ToastProvider";
import OfflineIndicator from "@/components/OfflineIndicator";
import CartConfirmModal from "@/components/CartConfirmModal";
import SplashScreen from "@/components/SplashScreen";
import PageTransition from "@/components/layout/PageTransition";
import TableCapture from "@/components/TableCapture";
import ClearStorage from "@/components/ClearStorage";



const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "BLU TABLE | N'Djamena",
  description: "Digital Menu & Gastronomic Experience",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/logo.png", sizes: "192x192", type: "image/png" },
      { url: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/logo.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Blu Table",
  },
  other: {
    "mobile-web-app-capable": "yes",
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
      <body className={`${montserrat.variable} ${playfair.variable} font-montserrat bg-radisson-light antialiased text-[#002C5F]`}>
        {/* <ClearStorage /> */}
        <SplashScreen />
        <LanguageProvider>
          <CurrencyProvider>
            <VenueProvider>
              <CartProvider>
                <MenuVisitedTracker />
                <Suspense fallback={null}>
                  <TableCapture />
                </Suspense>
                <Suspense fallback={<div className="h-16 bg-white animate-pulse" />}>
                  <Header />
                </Suspense>
                <PageTransition>
                  <Suspense fallback={
                    <div className="min-h-screen bg-radisson-light flex items-center justify-center">
                      <div className="w-12 h-12 border-4 border-radisson-gold/20 border-t-radisson-gold rounded-full animate-spin" />
                    </div>
                  }>
                    {children}
                  </Suspense>
                </PageTransition>
                <Suspense fallback={<div className="h-16 bg-white" />}>
                  <BottomNav />
                </Suspense>
                <InstallPrompt />
                <OfflineIndicator />
                <ToastProvider />
                <CartConfirmModal />
              </CartProvider>
            </VenueProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
