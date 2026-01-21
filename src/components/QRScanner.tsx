"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

declare global {
  interface Window {
    Html5Qrcode: any;
  }
}

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QRScanner({ isOpen, onClose }: QRScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const router = useRouter();
  const { language } = useLanguage();

  useEffect(() => {
    if (!isOpen) {
      // Nettoyer le scanner si on ferme
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current.clear().catch(() => {});
        html5QrCodeRef.current = null;
      }
      setIsScanning(false);
      setScanStatus('idle');
      return;
    }
    
    // Réinitialiser le statut quand on ouvre le scanner
    setScanStatus('idle');

    const loadScanner = async () => {
      try {
        // Charger dynamiquement html5-qrcode
        const { Html5Qrcode } = await import("html5-qrcode");
        
        if (!scannerRef.current || !isOpen) return;

        const qrCode = new Html5Qrcode(scannerRef.current.id);
        html5QrCodeRef.current = qrCode;

        try {
          await qrCode.start(
            { facingMode: "environment" }, // Utiliser la caméra arrière
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText: string) => {
              // QR code scanné avec succès - arrêter immédiatement pour éviter les scans multiples
              if (!html5QrCodeRef.current) return;
              
              console.log('QR Code scanné:', decodedText);
              setScanStatus('success');
              
              const currentScanner = html5QrCodeRef.current;
              html5QrCodeRef.current = null; // Marquer comme null immédiatement
              
              currentScanner.stop().then(() => {
                setIsScanning(false);
                currentScanner.clear().catch(() => {});
                
                // Fonction pour traiter et rediriger
                const processAndRedirect = (targetUrl: string) => {
                  console.log('Redirection vers:', targetUrl);
                  onClose(); // Fermer le modal avant la redirection
                  
                  // Utiliser window.location.href pour une redirection complète qui recharge la page
                  // Cela garantit que tous les paramètres sont bien pris en compte
                  setTimeout(() => {
                    window.location.href = targetUrl;
                  }, 200);
                };
                
                // Vérifier si c'est une URL valide
                if (decodedText.startsWith('http://') || decodedText.startsWith('https://')) {
                  // Extraire TOUS les paramètres de l'URL scannée
                  try {
                    const scannedUrl = new URL(decodedText);
                    console.log('URL scannée analysée:', {
                      origin: scannedUrl.origin,
                      pathname: scannedUrl.pathname,
                      search: scannedUrl.search,
                      params: Object.fromEntries(scannedUrl.searchParams)
                    });
                    
                    // Si l'URL scannée pointe vers le même domaine, utiliser directement
                    if (scannedUrl.origin === window.location.origin) {
                      // Extraire le chemin et tous les paramètres de query
                      const path = scannedUrl.pathname || '/';
                      const searchParams = scannedUrl.searchParams;
                      
                      // Construire la nouvelle URL avec le chemin et tous les paramètres
                      const newUrl = new URL(path, window.location.origin);
                      
                      // Copier TOUS les paramètres de l'URL scannée
                      searchParams.forEach((value, key) => {
                        newUrl.searchParams.set(key, value);
                      });
                      
                      console.log('URL finale (même domaine):', newUrl.toString());
                      processAndRedirect(newUrl.toString());
                    } else {
                      // URL d'un autre domaine - extraire seulement les paramètres pertinents
                      const newUrl = new URL('/', window.location.origin);
                      
                      // Extraire tous les paramètres de query de l'URL scannée
                      scannedUrl.searchParams.forEach((value, key) => {
                        // Normaliser les noms de paramètres communs
                        if (key === 'v' || key === 'venue' || key === 'restaurant') {
                          newUrl.searchParams.set('v', value);
                        } else {
                          // Conserver tous les autres paramètres (table, media queries, etc.)
                          newUrl.searchParams.set(key, value);
                        }
                      });
                      
                      console.log('URL finale (autre domaine):', newUrl.toString());
                      processAndRedirect(newUrl.toString());
                    }
                  } catch (e) {
                    console.error('Erreur lors du parsing de l\'URL:', e);
                    // Si l'URL n'est pas valide, essayer de rediriger directement
                    if (decodedText.includes(window.location.origin)) {
                      processAndRedirect(decodedText);
                    } else {
                      console.error('Invalid QR code URL:', decodedText);
                      // Essayer d'extraire les paramètres même si l'URL n'est pas complète
                      try {
                        const urlMatch = decodedText.match(/\?(.+)$/);
                        if (urlMatch) {
                          const params = new URLSearchParams(urlMatch[1]);
                          const newUrl = new URL('/', window.location.origin);
                          params.forEach((value, key) => {
                            newUrl.searchParams.set(key, value);
                          });
                          processAndRedirect(newUrl.toString());
                        } else {
                          onClose();
                        }
                      } catch {
                        onClose();
                      }
                    }
                  }
                } else {
                  // Si ce n'est pas une URL, essayer de l'utiliser comme paramètre venue
                  console.log('QR code n\'est pas une URL, utilisation comme paramètre v');
                  const newUrl = new URL('/', window.location.origin);
                  newUrl.searchParams.set('v', decodedText);
                  processAndRedirect(newUrl.toString());
                }
              }).catch((error: unknown) => {
                console.error('Erreur lors de l\'arrêt du scanner:', error);
                setIsScanning(false);
                html5QrCodeRef.current = null;
                onClose();
              });
            },
            (errorMessage: string) => {
              // Erreur de scan (continuera à scanner)
              // console.log('Scan error:', errorMessage);
            }
          );
          setIsScanning(true);
          setScanStatus('scanning');
        } catch (err) {
          console.error('Error starting camera:', err);
          setIsScanning(false);
        }
      } catch (err) {
        console.error('Error loading QR scanner:', err);
        setIsScanning(false);
      }
    };

    loadScanner();

    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current.clear().catch(() => {});
        html5QrCodeRef.current = null;
      }
      setIsScanning(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Seulement dépendre de isOpen pour éviter les re-exécutions

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
        
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {language === 'fr' ? 'Scanner le code QR' : 'Scan QR Code'}
          </h2>
          <p className="text-sm text-gray-500">
            {language === 'fr' 
              ? 'Pointez votre caméra vers le code QR' 
              : 'Point your camera at the QR code'}
          </p>
        </div>

        <div 
          id="qr-scanner" 
          ref={scannerRef}
          className="w-full rounded-xl overflow-hidden bg-gray-100"
          style={{ minHeight: '300px' }}
        />

        {scanStatus === 'idle' && !isScanning && (
          <div className="mt-4 text-center text-sm text-gray-500">
            {language === 'fr' 
              ? 'Chargement de la caméra...' 
              : 'Loading camera...'}
          </div>
        )}
        
        {scanStatus === 'scanning' && isScanning && (
          <div className="mt-4 text-center text-sm text-blue-600">
            {language === 'fr' 
              ? 'Scannez le code QR...' 
              : 'Scanning QR code...'}
          </div>
        )}
        
        {scanStatus === 'success' && (
          <div className="mt-4 text-center text-sm text-green-600 font-semibold">
            {language === 'fr' 
              ? '✓ Code QR scanné avec succès! Redirection...' 
              : '✓ QR code scanned successfully! Redirecting...'}
          </div>
        )}
      </div>
    </div>
  );
}

