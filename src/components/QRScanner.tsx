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
  const hasScannedRef = useRef(false); // Pour éviter les scans multiples
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
    hasScannedRef.current = false; // Réinitialiser le flag de scan

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
            (decodedText: string, decodedResult: any) => {
              // Éviter les scans multiples
              if (hasScannedRef.current || !html5QrCodeRef.current) {
                console.log('Scan ignoré (déjà traité ou scanner fermé)');
                return;
              }
              
              // Marquer comme scanné immédiatement
              hasScannedRef.current = true;
              
              // Nettoyer le texte décodé (enlever les espaces, retours à la ligne, etc.)
              const cleanText = decodedText.trim().replace(/\s+/g, '');
              
              console.log('=== QR CODE SCANNÉ ===');
              console.log('Texte brut:', decodedText);
              console.log('Texte nettoyé:', cleanText);
              console.log('Résultat complet:', decodedResult);
              
              setScanStatus('success');
              
              const currentScanner = html5QrCodeRef.current;
              html5QrCodeRef.current = null; // Marquer comme null immédiatement
              
              // Arrêter le scanner de manière sécurisée
              currentScanner.stop()
                .then(() => {
                  setIsScanning(false);
                  // clear() peut ne pas retourner une Promise, donc on vérifie
                  try {
                    const clearResult = currentScanner.clear();
                    if (clearResult && typeof clearResult === 'object' && typeof clearResult.catch === 'function') {
                      clearResult.catch(() => {});
                    }
                  } catch (e) {
                    // Ignorer les erreurs de clear()
                    console.log('clear() a échoué, continuons quand même');
                  }
                  
                  // Fonction pour traiter et rediriger
                  const processAndRedirect = (targetUrl: string) => {
                    console.log('=== REDIRECTION ===');
                    console.log('URL cible:', targetUrl);
                    
                    // Construire l'URL finale
                    let finalUrl: string;
                    try {
                      if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
                        // URL complète, utiliser directement mais adapter le domaine si nécessaire
                        const url = new URL(targetUrl);
                        // Si c'est un autre domaine, extraire seulement les paramètres
                        if (url.origin !== window.location.origin) {
                          const newUrl = new URL('/', window.location.origin);
                          url.searchParams.forEach((value, key) => {
                            newUrl.searchParams.set(key, value);
                          });
                          finalUrl = newUrl.toString();
                        } else {
                          finalUrl = targetUrl;
                        }
                      } else {
                        // URL relative, construire avec l'origin actuel
                        finalUrl = new URL(targetUrl, window.location.origin).toString();
                      }
                      
                      console.log('URL finale construite:', finalUrl);
                      console.log('Redirection dans 300ms...');
                      
                      onClose(); // Fermer le modal avant la redirection
                      
                      // Utiliser window.location.href pour une redirection complète qui recharge la page
                      setTimeout(() => {
                        console.log('Exécution de la redirection vers:', finalUrl);
                        window.location.href = finalUrl;
                      }, 300);
                    } catch (urlError) {
                      console.error('Erreur lors de la construction de l\'URL:', urlError);
                      onClose();
                    }
                  };
                
                // Utiliser le texte nettoyé pour le traitement
                const textToProcess = cleanText || decodedText;
                
                // Vérifier si c'est une URL valide
                if (textToProcess.startsWith('http://') || textToProcess.startsWith('https://')) {
                  // Extraire TOUS les paramètres de l'URL scannée
                  try {
                    const scannedUrl = new URL(textToProcess);
                    console.log('=== ANALYSE URL SCANNÉE ===');
                    console.log('Origin:', scannedUrl.origin);
                    console.log('Pathname:', scannedUrl.pathname);
                    console.log('Search:', scannedUrl.search);
                    console.log('Hash:', scannedUrl.hash);
                    console.log('Paramètres:', Object.fromEntries(scannedUrl.searchParams));
                    
                    // Toujours extraire les paramètres et construire une URL avec le domaine actuel
                    // Cela permet de fonctionner même si le QR code contient un autre domaine
                    const newUrl = new URL('/', window.location.origin);
                    
                    // Copier TOUS les paramètres de l'URL scannée
                    scannedUrl.searchParams.forEach((value, key) => {
                      // Normaliser les noms de paramètres communs
                      if (key === 'v' || key === 'venue' || key === 'restaurant') {
                        newUrl.searchParams.set('v', value);
                      } else {
                        // Conserver tous les autres paramètres (table, media queries, etc.)
                        newUrl.searchParams.set(key, value);
                      }
                    });
                    
                    console.log('=== CONSTRUCTION URL FINALE ===');
                    console.log('Origin scanné:', scannedUrl.origin);
                    console.log('Origin actuel:', window.location.origin);
                    console.log('Paramètres extraits:', Object.fromEntries(newUrl.searchParams));
                    console.log('URL finale:', newUrl.toString());
                    
                    processAndRedirect(newUrl.toString());
                  } catch (e) {
                    console.error('=== ERREUR PARSING URL ===');
                    console.error('Erreur:', e);
                    console.error('Texte reçu:', textToProcess);
                    
                    // Si l'URL n'est pas valide, essayer de rediriger directement
                    if (textToProcess.includes(window.location.origin) || textToProcess.includes('localhost') || textToProcess.includes('theblutable')) {
                      console.log('Tentative de redirection directe avec le texte brut');
                      processAndRedirect(textToProcess);
                    } else {
                      // Essayer d'extraire les paramètres même si l'URL n'est pas complète
                      console.log('Tentative d\'extraction des paramètres depuis le texte');
                      try {
                        // Chercher les paramètres dans le texte (format ?v=xxx&table=yyy)
                        const urlMatch = textToProcess.match(/[?&]([^=&]+)=([^&]+)/g);
                        if (urlMatch && urlMatch.length > 0) {
                          const newUrl = new URL('/', window.location.origin);
                          urlMatch.forEach(param => {
                            const [key, value] = param.replace(/[?&]/, '').split('=');
                            if (key && value) {
                              newUrl.searchParams.set(key, decodeURIComponent(value));
                            }
                          });
                          console.log('URL reconstruite depuis paramètres:', newUrl.toString());
                          processAndRedirect(newUrl.toString());
                        } else {
                          // Si on trouve juste des valeurs sans clés, essayer de les utiliser comme paramètres
                          const simpleMatch = textToProcess.match(/(?:v|venue|restaurant|table)=([^&\s]+)/i);
                          if (simpleMatch) {
                            const newUrl = new URL('/', window.location.origin);
                            if (textToProcess.toLowerCase().includes('v=') || textToProcess.toLowerCase().includes('venue=')) {
                              const vMatch = textToProcess.match(/(?:v|venue)=([^&\s]+)/i);
                              if (vMatch) newUrl.searchParams.set('v', vMatch[1]);
                            }
                            if (textToProcess.toLowerCase().includes('table=')) {
                              const tMatch = textToProcess.match(/table=([^&\s]+)/i);
                              if (tMatch) newUrl.searchParams.set('table', tMatch[1]);
                            }
                            console.log('URL reconstruite depuis valeurs simples:', newUrl.toString());
                            processAndRedirect(newUrl.toString());
                          } else {
                            console.error('Impossible d\'extraire les paramètres du QR code');
                            onClose();
                          }
                        }
                      } catch (parseError) {
                        console.error('Erreur lors de l\'extraction des paramètres:', parseError);
                        onClose();
                      }
                    }
                  }
                } else {
                  // Si ce n'est pas une URL, essayer de l'utiliser comme paramètre venue
                  console.log('=== QR CODE N\'EST PAS UNE URL ===');
                  console.log('Texte:', textToProcess);
                  console.log('Utilisation comme paramètre v');
                  
                  const newUrl = new URL('/', window.location.origin);
                  newUrl.searchParams.set('v', textToProcess);
                  processAndRedirect(newUrl.toString());
                }
                })
                .catch((error: unknown) => {
                  console.error('Erreur lors de l\'arrêt du scanner:', error);
                  setIsScanning(false);
                  html5QrCodeRef.current = null;
                  // Même en cas d'erreur, continuer avec la redirection si on a le texte décodé
                  if (cleanText || decodedText) {
                    const textToProcess = cleanText || decodedText;
                    console.log('Tentative de redirection malgré l\'erreur d\'arrêt');
                    // Traiter le texte décodé même si l'arrêt a échoué
                    setTimeout(() => {
                      if (textToProcess.startsWith('http')) {
                        try {
                          const scannedUrl = new URL(textToProcess);
                          const newUrl = new URL('/', window.location.origin);
                          scannedUrl.searchParams.forEach((value, key) => {
                            if (key === 'v' || key === 'venue' || key === 'restaurant') {
                              newUrl.searchParams.set('v', value);
                            } else {
                              newUrl.searchParams.set(key, value);
                            }
                          });
                          console.log('Redirection d\'urgence vers:', newUrl.toString());
                          window.location.href = newUrl.toString();
                        } catch (e) {
                          console.error('Impossible de rediriger:', e);
                          onClose();
                        }
                      } else {
                        onClose();
                      }
                    }, 100);
                  } else {
                    onClose();
                  }
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

