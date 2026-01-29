"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Camera, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

declare global {
  interface Window {
    Html5Qrcode: unknown;
  }
}

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Précharger le module html5-qrcode
let html5QrcodeModule: typeof import("html5-qrcode") | null = null;
const preloadScanner = () => {
  if (!html5QrcodeModule) {
    import("html5-qrcode").then((module) => {
      html5QrcodeModule = module;
    });
  }
};

// Exporter pour permettre le préchargement au hover
export { preloadScanner };

export default function QRScanner({ isOpen, onClose }: QRScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<InstanceType<typeof import("html5-qrcode").Html5Qrcode> | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'loading' | 'scanning' | 'success' | 'error'>('loading');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const hasScannedRef = useRef(false);
  const router = useRouter();
  const { language } = useLanguage();

  const processQRCode = useCallback((decodedText: string) => {
    const cleanText = decodedText.trim().replace(/\s+/g, '');

    const processAndRedirect = (targetUrl: string) => {
      onClose();
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 150); // Réduit de 300ms à 150ms
    };

    if (cleanText.startsWith('http://') || cleanText.startsWith('https://')) {
      try {
        const scannedUrl = new URL(cleanText);
        const newUrl = new URL('/', window.location.origin);

        scannedUrl.searchParams.forEach((value, key) => {
          if (key === 'v' || key === 'venue' || key === 'restaurant') {
            newUrl.searchParams.set('v', value);
          } else {
            newUrl.searchParams.set(key, value);
          }
        });

        processAndRedirect(newUrl.toString());
      } catch {
        onClose();
      }
    } else {
      const newUrl = new URL('/', window.location.origin);
      newUrl.searchParams.set('v', cleanText);
      processAndRedirect(newUrl.toString());
    }
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => { });
        html5QrCodeRef.current = null;
      }
      setIsScanning(false);
      setScanStatus('loading');
      setPermissionDenied(false);
      return;
    }

    setScanStatus('loading');
    hasScannedRef.current = false;

    const loadScanner = async () => {
      try {
        // Utiliser le module préchargé ou le charger
        const qrModule = html5QrcodeModule || await import("html5-qrcode");
        html5QrcodeModule = qrModule;

        if (!scannerRef.current || !isOpen) return;

        const qrCode = new qrModule.Html5Qrcode(scannerRef.current.id);
        html5QrCodeRef.current = qrCode;

        await qrCode.start(
          { facingMode: "environment" },
          {
            fps: 15, // Augmenté pour une détection plus rapide
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText: string) => {
            if (hasScannedRef.current || !html5QrCodeRef.current) return;
            hasScannedRef.current = true;
            setScanStatus('success');

            const currentScanner = html5QrCodeRef.current;
            html5QrCodeRef.current = null;

            currentScanner.stop()
              .then(() => {
                setIsScanning(false);
                processQRCode(decodedText);
              })
              .catch(() => {
                processQRCode(decodedText);
              });
          },
          () => { } // Ignorer les erreurs de scan continues
        );

        setIsScanning(true);
        setScanStatus('scanning');
      } catch (err) {
        console.error('Camera error:', err);
        setPermissionDenied(true);
        setScanStatus('error');
      }
    };

    loadScanner();

    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => { });
        html5QrCodeRef.current = null;
      }
    };
  }, [isOpen, processQRCode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
        <h2 className="text-white font-semibold text-lg">
          {language === 'fr' ? 'Scanner QR' : 'Scan QR'}
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Scanner Container */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          id="qr-scanner"
          ref={scannerRef}
          className="w-full h-full"
          style={{
            opacity: isScanning ? 1 : 0,
            transition: 'opacity 0.2s ease'
          }}
        />

        {/* Scanner Frame Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Dark overlay with center cutout */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-72 h-72">
              {/* Animated corner frames */}
              <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-xl" />
              <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-xl" />
              <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-xl" />
              <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-xl" />

              {/* Scanning line animation */}
              {scanStatus === 'scanning' && (
                <div className="absolute top-0 left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-radisson-gold to-transparent animate-scan" />
              )}

              {/* Success indicator */}
              {scanStatus === 'success' && (
                <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-xl">
                  <CheckCircle2 className="w-20 h-20 text-green-400 animate-scale-up" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="text-center">
          {scanStatus === 'loading' && (
            <div className="flex flex-col items-center gap-3">
              <Camera className="w-8 h-8 text-white/60 animate-pulse" />
              <p className="text-white/80 text-sm">
                {language === 'fr' ? 'Activation de la caméra...' : 'Starting camera...'}
              </p>
            </div>
          )}

          {scanStatus === 'scanning' && (
            <p className="text-white/80 text-sm">
              {language === 'fr'
                ? 'Placez le code QR dans le cadre'
                : 'Position QR code in the frame'}
            </p>
          )}

          {scanStatus === 'success' && (
            <p className="text-green-400 text-sm font-semibold">
              {language === 'fr'
                ? '✓ Code scanné ! Redirection...'
                : '✓ Code scanned! Redirecting...'}
            </p>
          )}

          {permissionDenied && (
            <div className="text-center">
              <p className="text-red-400 text-sm mb-3">
                {language === 'fr'
                  ? 'Accès à la caméra refusé'
                  : 'Camera access denied'}
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm"
              >
                {language === 'fr' ? 'Fermer' : 'Close'}
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(280px); opacity: 1; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
