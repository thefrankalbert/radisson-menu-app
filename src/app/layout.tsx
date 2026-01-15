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
import CartConfirmModal from "@/components/CartConfirmModal";
import SplashScreen from "@/components/SplashScreen";



const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "BLU TABLE | N'Djamena",
  description: "Digital Menu & Gastronomic Experience",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/logo.png", sizes: "32x32", type: "image/png" },
      { url: "/logo.png", sizes: "192x192", type: "image/png" },
      { url: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: [
      { url: "/logo.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Blu Table",
  },
  openGraph: {
    title: "BLU TABLE | N'Djamena",
    description: "Digital Menu & Gastronomic Experience",
    url: "https://www.theblutable.com",
    siteName: "BLU TABLE",
    images: [
      {
        url: "https://www.theblutable.com/logo.png",
        width: 512,
        height: 512,
        alt: "BLU TABLE Logo",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BLU TABLE | N'Djamena",
    description: "Digital Menu & Gastronomic Experience",
    images: ["https://www.theblutable.com/logo.png"],
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
      <body className={`${montserrat.className} bg-radisson-light antialiased text-[#002C5F]`}>
        <SplashScreen />
        <LanguageProvider>
          <CartProvider>
            <MenuVisitedTracker />
            <Header />
            {children}
            <BottomNav />
            <InstallPrompt />
            <OfflineIndicator />
            <ToastProvider />
            <CartConfirmModal />
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
