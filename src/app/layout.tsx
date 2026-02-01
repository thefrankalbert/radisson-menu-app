import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
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



// Geometric, Clean, Modern typography
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "BLU TABLE | Menu Digital - Radisson Blu N'Djamena",
  description: "Découvrez les menus du Radisson Blu N'Djamena : Restaurant Panorama, Lobby Bar et Pool Bar. Commandez directement depuis votre table.",
  manifest: "/manifest.json",
  metadataBase: new URL("https://theblutable.com"),
  alternates: {
    canonical: "/",
  },
  keywords: ["menu digital", "restaurant N'Djamena", "Radisson Blu", "Tchad", "Panorama Restaurant", "Lobby Bar", "commande en ligne"],
  authors: [{ name: "Radisson Blu N'Djamena" }],
  creator: "Radisson Blu N'Djamena",
  publisher: "Radisson Blu N'Djamena",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    alternateLocale: "en_US",
    url: "https://theblutable.com",
    siteName: "Blu Table",
    title: "BLU TABLE | Menu Digital - Radisson Blu N'Djamena",
    description: "Découvrez les menus du Radisson Blu N'Djamena : Restaurant Panorama, Lobby Bar et Pool Bar. Commandez directement depuis votre table.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Blu Table - Menu Digital Radisson Blu N'Djamena",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BLU TABLE | Menu Digital - Radisson Blu N'Djamena",
    description: "Découvrez les menus du Radisson Blu N'Djamena. Commandez directement depuis votre table.",
    images: ["/og-image.png"],
  },
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
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="scroll-smooth" suppressHydrationWarning>

      <body className={`${plusJakartaSans.variable} font-sans bg-background antialiased text-foreground`} suppressHydrationWarning>

        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:bg-white focus:px-4 focus:py-2 focus:rounded-lg focus:border focus:border-gray-200 focus:text-[#002C5F] focus:font-bold"
        >
          Aller au contenu principal
        </a>
        {/* <ClearStorage /> */}
        <SplashScreen />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
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
                  <main id="main-content">
                    <PageTransition>
                      <Suspense fallback={
                        <div className="min-h-screen bg-radisson-light flex items-center justify-center">
                          <div className="w-12 h-12 border-4 border-radisson-gold/20 border-t-radisson-gold rounded-full animate-spin" />
                        </div>
                      }>
                        {children}
                      </Suspense>
                    </PageTransition>
                  </main>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
