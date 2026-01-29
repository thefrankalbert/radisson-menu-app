"use client";

import { useEffect, useState, useCallback } from "react";
import {
    QrCode as QrIcon,
    Download,
    Printer,
    Loader2,
    Search,
    RefreshCw,
    ChevronRight,
    Palette,
    Maximize,
    ArrowLeft
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Restaurant } from "@/types/admin";
import FormField from "@/components/admin/FormField";
import { toast } from "react-hot-toast";
import QRCode from 'qrcode';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { QRCodeSkeleton } from "@/components/admin/Skeleton";

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
        color: "000000",
        bgColor: "FFFFFF",
        showLogo: true,
        tableNumber: ""
    });
    const [qrDataUrl, setQrDataUrl] = useState<string>("");

    const generateQRCode = useCallback(async (card: Restaurant) => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const venueMap: Record<string, string> = {
            'carte-panorama-restaurant': 'panorama',
            'carte-lobby-bar-snacks': 'lobby'
        };
        const venueFilter = venueMap[card.slug] || '';
        const menuUrl = `${baseUrl}/${venueFilter ? `?v=${venueFilter}` : ''}${config.tableNumber ? `${venueFilter ? '&' : '?'}table=${config.tableNumber}` : ''}`;

        try {
            const url = await QRCode.toDataURL(menuUrl, {
                width: config.size,
                margin: 2,
                color: { dark: `#${config.color}`, light: `#${config.bgColor}` }
            });
            setQrDataUrl(url);
        } catch (err) {
            toast.error("Erreur de génération");
        }
    }, [config]);

    const loadCards = async () => {
        try {
            const allowedSlugs = ['carte-panorama-restaurant', 'carte-lobby-bar-snacks'];
            const { data, error } = await supabase
                .from('restaurants')
                .select('*')
                .eq('is_active', true)
                .in('slug', allowedSlugs);
            if (error) throw error;
            setCards(data || []);
            if (data?.length) setSelectedCard(data[0]);
        } catch (error) {
            toast.error('Erreur de chargement');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadCards(); }, []);
    useEffect(() => { if (selectedCard) generateQRCode(selectedCard); }, [selectedCard, generateQRCode]);

    const filteredCards = cards.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleDownload = () => {
        if (!selectedCard || !qrDataUrl) return;
        const link = document.createElement('a');
        link.href = qrDataUrl;
        link.download = `QR-${selectedCard.slug}.png`;
        link.click();
    };

    if (loading) return <QRCodeSkeleton />;

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div>
                <h1 className="text-2xl font-black text-gray-900 uppercase">Générateur QR</h1>
                <p className="text-slate-400 text-sm font-medium">Configurez vos accès tables et menus digitaux.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-10 bg-background border border-input rounded-md pl-11 pr-4 text-sm font-medium text-foreground outline-none focus:ring-1 focus:ring-ring transition-all"
                        />
                    </div>

                    <div className="bg-card rounded-md border border-border overflow-hidden">
                        {filteredCards.map((card) => (
                            <button
                                key={card.id}
                                onClick={() => setSelectedCard(card)}
                                className={`w-full flex items-center p-3 transition-all border-b border-border last:border-0 ${selectedCard?.id === card.id ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
                            >
                                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center mr-3 text-muted-foreground border border-border">
                                    <QrIcon className="w-4 h-4" />
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                    <p className="font-bold text-xs truncate uppercase tracking-tight">{card.name}</p>
                                    <p className="text-[9px] font-semibold uppercase tracking-wider opacity-60 truncate">/{card.slug}</p>
                                </div>
                                <ChevronRight className={`w-3.5 h-3.5 opacity-30 transition-transform ${selectedCard?.id === card.id ? 'rotate-90' : ''}`} />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div id="qr-preview-area" className="bg-card rounded-md p-8 border border-border flex flex-col items-center justify-center space-y-8 min-h-[400px]">
                        <div className="text-center">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.3em] mb-2">Radisson Blu</p>
                            <h4 className="text-lg font-bold text-foreground uppercase tracking-tight">{selectedCard?.name}</h4>
                        </div>

                        <div className="p-4 bg-white border border-border rounded-md relative group">
                            {qrDataUrl ? (
                                <img src={qrDataUrl} alt="QR" className="w-48 h-48 rounded-sm" />
                            ) : (
                                <div className="w-48 h-48 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted" /></div>
                            )}
                        </div>

                        {config.tableNumber && (
                            <div className="bg-foreground text-background px-8 py-3 rounded-md font-bold text-2xl tracking-tighter">
                                TABLE {config.tableNumber}
                            </div>
                        )}

                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.2em] opacity-40">Scannez & Commandez</p>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-card rounded-md p-6 border border-border space-y-6">
                            <div className="flex items-center space-x-2 pb-4 border-b border-border">
                                <Palette className="w-4 h-4 text-muted-foreground" />
                                <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">Configuration</span>
                            </div>

                            <FormField
                                label="Table N°"
                                name="table"
                                type="text"
                                value={config.tableNumber}
                                onChange={(v) => setConfig(prev => ({ ...prev, tableNumber: v }))}
                                placeholder="00"
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    label="Couleur"
                                    name="color"
                                    type="select"
                                    value={config.color}
                                    onChange={(v) => setConfig(prev => ({ ...prev, color: v }))}
                                    options={[
                                        { value: "000000", label: "Noir" },
                                        { value: "003058", label: "Bleu" },
                                        { value: "C5A065", label: "Or" }
                                    ]}
                                />
                                <FormField
                                    label="Taille"
                                    name="size"
                                    type="select"
                                    value={config.size.toString()}
                                    onChange={(v) => setConfig(prev => ({ ...prev, size: parseInt(v) }))}
                                    options={[
                                        { value: "512", label: "HD" },
                                        { value: "1024", label: "4K" }
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleDownload}
                                className="h-12 bg-primary text-primary-foreground rounded-md font-semibold text-[10px] uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all"
                            >
                                Télécharger PNG
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="h-12 bg-muted border border-border text-foreground rounded-md font-semibold text-[10px] uppercase tracking-wider hover:bg-accent transition-all"
                            >
                                Imprimer
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    header, aside, .lg\\:col-span-4, .space-y-6:last-child { display: none !important; }
                    main { padding: 0 !important; }
                    .lg\\:col-span-8 { width: 100% !important; margin: 0 !important; }
                    #qr-preview-area { border: 0 !important; width: 100% !important; }
                }
            `}</style>
        </div>
    );
}
