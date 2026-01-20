"use client";

import { useEffect, useState } from "react";
import {
    QrCode as QrIcon,
    Download,
    Printer,
    Loader2,
    Search,
    RefreshCw,
    ExternalLink,
    ChevronRight,
    Palette,
    Maximize
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Restaurant } from "@/types/admin";
import Modal from "@/components/admin/Modal";
import FormField from "@/components/admin/FormField";
import { toast } from "react-hot-toast";
import QRCode from 'qrcode';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

type QRConfig = {
    size: number;
    color: string;
    bgColor: string;
    showLogo: boolean;
    tableNumber: string;
};

export default function QRCodesPage() {
    const [cards, setCards] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCard, setSelectedCard] = useState<Restaurant | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [config, setConfig] = useState<QRConfig>({
        size: 512,
        color: "003058", // Radisson Blue without #
        bgColor: "FFFFFF",
        showLogo: true,
        tableNumber: ""
    });

    const [qrDataUrl, setQrDataUrl] = useState<string>("");

    const generateQRCode = async (card: Restaurant) => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        
        // Mapping des slugs vers les filtres de venue
        const venueMap: Record<string, string> = {
            'carte-panorama-restaurant': 'panorama',
            'carte-lobby-bar-snacks': 'lobby'
        };
        
        const venueFilter = venueMap[card.slug] || '';
        // Les QR codes pointent maintenant vers la homepage avec le filtre de venue
        const menuUrl = `${baseUrl}/${venueFilter ? `?v=${venueFilter}` : ''}${config.tableNumber ? `${venueFilter ? '&' : '?'}table=${config.tableNumber}` : ''}`;

        try {
            const url = await QRCode.toDataURL(menuUrl, {
                width: config.size,
                margin: 2,
                color: {
                    dark: `#${config.color}`,
                    light: `#${config.bgColor}`
                }
            });
            setQrDataUrl(url);
        } catch (err) {
            console.error(err);
            toast.error("Erreur lors de la génération du QR Code");
        }
    };

    const loadCards = async () => {
        try {
            // Seuls les restaurants Panorama et Lobby sont disponibles pour la génération de QR codes
            const allowedSlugs = ['carte-panorama-restaurant', 'carte-lobby-bar-snacks'];
            
            const { data, error } = await supabase
                .from('restaurants')
                .select('*')
                .eq('is_active', true)
                .in('slug', allowedSlugs)
                .order('name');
            if (error) throw error;
            setCards(data || []);
            if (data && data.length > 0) setSelectedCard(data[0]);
        } catch (error) {
            toast.error('Erreur lors du chargement des cartes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCards();
    }, []);

    useEffect(() => {
        if (selectedCard) {
            generateQRCode(selectedCard);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCard, config]);

    const filteredCards = cards.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getQRUrl = (card: Restaurant, size?: number) => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        
        // Mapping des slugs vers les filtres de venue
        const venueMap: Record<string, string> = {
            'carte-panorama-restaurant': 'panorama',
            'carte-lobby-bar-snacks': 'lobby'
        };
        
        const venueFilter = venueMap[card.slug] || '';
        // Les QR codes pointent maintenant vers la homepage avec le filtre de venue
        const menuUrl = `${baseUrl}/${venueFilter ? `?v=${venueFilter}` : ''}${config.tableNumber ? `${venueFilter ? '&' : '?'}table=${config.tableNumber}` : ''}`;

        return `https://api.qrserver.com/v1/create-qr-code/?size=${size || config.size}x${size || config.size}&data=${encodeURIComponent(menuUrl)}&color=${config.color}&bgcolor=${config.bgColor}&margin=2`;
    };

    const handleDownload = () => {
        if (!selectedCard || !qrDataUrl) return;
        const link = document.createElement('a');
        link.href = qrDataUrl;
        link.download = `QR-${selectedCard.slug}${config.tableNumber ? `-T${config.tableNumber}` : ''}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadPDF = async () => {
        const element = document.getElementById('qr-preview-area');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`QR-${selectedCard?.slug}.pdf`);
            toast.success("PDF généré !");
        } catch (err) {
            toast.error("Erreur lors de la génération du PDF");
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-12 h-12 text-[#C5A065] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl lg:text-3xl font-black text-[#003058] tracking-tight">Générateur de QR Codes</h1>
                <p className="text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base font-medium">Créez et personnalisez les QR codes pour Restaurant Panorama et Restaurant Lobby.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
                {/* Carte Selection List */}
                <div className="lg:col-span-4 space-y-3 sm:space-y-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#C5A065] transition-colors" />
                        <input
                            type="text"
                            placeholder="Rechercher une carte..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-11 sm:h-12 bg-white border border-[#F5F5F5] rounded-xl sm:rounded-2xl pl-11 sm:pl-12 pr-4 text-sm font-bold text-[#003058] outline-none focus:ring-2 focus:ring-[#C5A065]/20 transition-all"
                        />
                    </div>

                    <div className="bg-white rounded-2xl sm:rounded-[2.5rem] border border-[#F5F5F5] overflow-hidden shadow-sm">
                        <div className="p-3 sm:p-4 bg-slate-50/50 border-b border-[#F5F5F5]">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">SÉLECTIONNEZ UN MENU</p>
                        </div>
                        <div className="max-h-[300px] sm:max-h-[400px] lg:max-h-[500px] overflow-y-auto custom-scrollbar">
                            {filteredCards.map((card) => (
                                <button
                                    key={card.id}
                                    onClick={() => setSelectedCard(card)}
                                    className={`w-full flex items-center p-3 sm:p-4 transition-all hover:bg-slate-50 border-b border-[#F5F5F5] last:border-0 relative ${selectedCard?.id === card.id ? 'bg-[#003058]/5' : ''
                                        }`}
                                >
                                    {selectedCard?.id === card.id && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 bg-[#C5A065]" />
                                    )}
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mr-2 sm:mr-3 overflow-hidden">
                                        {card.image_url ? (
                                            <img src={card.image_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <QrIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
                                        )}
                                    </div>
                                    <div className="text-left flex-1 min-w-0">
                                        <p className={`font-bold text-xs sm:text-sm truncate ${selectedCard?.id === card.id ? 'text-[#003058]' : 'text-slate-600'}`}>
                                            {card.name}
                                        </p>
                                        <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">
                                            /{card.slug}
                                        </p>
                                    </div>
                                    <ChevronRight className={`w-3 h-3 sm:w-4 sm:h-4 text-slate-300 transition-transform flex-shrink-0 ${selectedCard?.id === card.id ? 'rotate-90 text-[#C5A065]' : ''}`} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Generator & Preview */}
                <div className="lg:col-span-8 space-y-4 sm:space-y-6">
                    {selectedCard ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                            {/* Preview Section */}
                            <div id="qr-preview-area" className="bg-white rounded-2xl sm:rounded-[3rem] p-6 sm:p-8 lg:p-10 flex flex-col items-center justify-center border border-[#F5F5F5] shadow-sm space-y-6 sm:space-y-8 print:p-0 print:border-0 print:shadow-none">
                                <div className="text-center">
                                    <h4 className="text-base sm:text-lg font-black text-[#003058] tracking-tight">{selectedCard.name}</h4>
                                    <p className="text-[10px] sm:text-xs text-[#C5A065] font-bold uppercase tracking-widest mt-1">Radisson Blu Hotel</p>
                                </div>

                                <div className="relative group p-3 sm:p-4 bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-[#003058]/10 border border-[#F5F5F5] w-full max-w-xs sm:max-w-none">
                                    {qrDataUrl ? (
                                        <img
                                            src={qrDataUrl}
                                            alt="QR Code Preview"
                                            className="w-full h-auto rounded-xl aspect-square max-w-[200px] sm:max-w-[256px] lg:max-w-[256px] mx-auto"
                                        />
                                    ) : (
                                        <div className="w-full aspect-square max-w-[200px] sm:max-w-[256px] lg:max-w-[256px] mx-auto flex items-center justify-center">
                                            <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-[#003058]/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all rounded-2xl sm:rounded-3xl flex items-center justify-center flex-col space-y-3">
                                        <div className="h-10 w-10 bg-[#C5A065] rounded-full flex items-center justify-center text-white">
                                            <Maximize className="w-5 h-5" />
                                        </div>
                                        <p className="text-white text-[10px] font-black uppercase tracking-widest hidden sm:block">Survol pour agrandir</p>
                                    </div>
                                </div>

                                {config.tableNumber && (
                                    <div className="bg-[#003058] text-white px-6 sm:px-8 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-black text-xl sm:text-2xl shadow-xl shadow-blue-900/30">
                                        TABLE {config.tableNumber}
                                    </div>
                                )}

                                <div className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em] text-center">
                                    Scannez & Commandez
                                </div>
                            </div>

                            {/* Configuration Panel */}
                            <div className="bg-white rounded-2xl sm:rounded-[3rem] p-6 sm:p-8 border border-[#F5F5F5] shadow-sm space-y-6 sm:space-y-8">
                                <div>
                                    <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                                        <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-[#C5A065]" />
                                        <h3 className="font-black text-[#003058] uppercase text-[10px] sm:text-xs tracking-widest">Configuration</h3>
                                    </div>

                                    <div className="space-y-4 sm:space-y-6">
                                        <FormField
                                            label="Numéro de Table (Facultatif)"
                                            name="table"
                                            type="text"
                                            value={config.tableNumber}
                                            onChange={(v) => setConfig(prev => ({ ...prev, tableNumber: v }))}
                                            placeholder="Ex: 12"
                                        />

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                            <FormField
                                                label="Couleur QR"
                                                name="color"
                                                type="select"
                                                value={config.color}
                                                onChange={(v) => setConfig(prev => ({ ...prev, color: v }))}
                                                options={[
                                                    { value: "003058", label: "Bleu Radisson" },
                                                    { value: "C5A065", label: "Or Radisson" },
                                                    { value: "000000", label: "Noir" },
                                                    { value: "2D3748", label: "Gris Foncé" }
                                                ]}
                                            />
                                            <FormField
                                                label="Taille (PX)"
                                                name="size"
                                                type="select"
                                                value={config.size.toString()}
                                                onChange={(v) => setConfig(prev => ({ ...prev, size: parseInt(v) }))}
                                                options={[
                                                    { value: "256", label: "256x256" },
                                                    { value: "512", label: "512x512" },
                                                    { value: "1024", label: "1024x1024" }
                                                ]}
                                            />
                                        </div>

                                        <div className="p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-dashed border-slate-200">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center mb-2">
                                                <RefreshCw className="w-3 h-3 mr-2 text-[#C5A065]" />
                                                Lien de destination
                                            </p>
                                            <p className="text-[10px] sm:text-xs font-bold text-[#003058] break-all">
                                                {(() => {
                                                    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                                                    const venueMap: Record<string, string> = {
                                                        'carte-panorama-restaurant': 'panorama',
                                                        'carte-lobby-bar-snacks': 'lobby'
                                                    };
                                                    const venueFilter = venueMap[selectedCard.slug] || '';
                                                    const url = `${baseUrl}/${venueFilter ? `?v=${venueFilter}` : ''}${config.tableNumber ? `${venueFilter ? '&' : '?'}table=${config.tableNumber}` : ''}`;
                                                    return url;
                                                })()}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 sm:pt-6 border-t border-[#F5F5F5]">
                                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                        <button
                                            onClick={handleDownload}
                                            className="h-12 sm:h-14 bg-[#003058] text-white rounded-xl sm:rounded-2xl font-black text-[10px] uppercase tracking-[0.1em] flex items-center justify-center space-x-1 sm:space-x-2 hover:scale-[1.02] transition-all shadow-xl shadow-blue-900/20 active:scale-[0.98]"
                                        >
                                            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                                            <span className="text-[9px] sm:text-[10px]">PNG</span>
                                        </button>
                                        <button
                                            onClick={handleDownloadPDF}
                                            className="h-12 sm:h-14 bg-[#C5A065] text-white rounded-xl sm:rounded-2xl font-black text-[10px] uppercase tracking-[0.1em] flex items-center justify-center space-x-1 sm:space-x-2 hover:scale-[1.02] transition-all shadow-xl shadow-amber-900/20 active:scale-[0.98]"
                                        >
                                            <QrIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                            <span className="text-[9px] sm:text-[10px]">PDF</span>
                                        </button>
                                    </div>
                                    <button
                                        onClick={handlePrint}
                                        className="w-full h-12 sm:h-14 bg-white border-2 border-[#F5F5F5] text-[#003058] rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] flex items-center justify-center space-x-2 sm:space-x-3 hover:bg-slate-50 transition-all active:scale-[0.98]"
                                    >
                                        <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
                                        <span className="text-[9px] sm:text-xs">Imprimer Label</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[400px] sm:min-h-[500px] bg-white rounded-2xl sm:rounded-[3rem] p-8 sm:p-12 flex flex-col items-center justify-center border border-[#F5F5F5] text-center">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                                <QrIcon className="w-8 h-8 sm:w-10 sm:h-10 text-slate-200" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-black text-[#003058]">Aucune carte sélectionnée</h3>
                            <p className="text-slate-400 mt-2 text-sm sm:text-base font-medium px-4">Choisissez un menu dans la liste ci-dessus pour générer son QR code.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    main { padding: 0 !important; }
                    .print-area { display: block !important; }
                    header, aside, .lg\\:col-span-4, .bg-white.rounded-\\[3rem\\]:last-child { display: none !important; }
                    .lg\\:col-span-8 { width: 100% !important; border: 0 !important; }
                    .bg-white.rounded-\\[3rem\\] { border: 0 !important; box-shadow: none !important; }
                }
            `}</style>
        </div>
    );
}
