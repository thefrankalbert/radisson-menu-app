"use client";

import { useEffect, useState, useCallback } from "react";
import {
    TrendingUp,
    Users,
    Loader2,
    Trophy,
    Wallet,
    Package,
    ArrowUpRight,
    Printer
} from "lucide-react";
import dynamic from "next/dynamic";

const RevenueChart = dynamic(() => import("@/components/admin/reports/RevenueChart"), {
    ssr: false,
    loading: () => <Skeleton className="w-full h-full" />
});

const CategoryPieChart = dynamic(() => import("@/components/admin/reports/CategoryPieChart"), {
    ssr: false,
    loading: () => <Skeleton className="w-full h-full rounded-full" />
});
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { jsPDF } from "jspdf";
import Skeleton, { StatsCardSkeleton } from "@/components/admin/Skeleton";
import { cn } from "@/lib/utils";



type PeriodType = '24h' | '7d' | '30d' | 'year';

type ReportStats = {
    revenue: number;
    orderCount: number;
    uniqueTables: number;
    avgBasket: number;
    revenueTrend: number;
    orderTrend: number;
};

type DailyRevenue = {
    name: string;
    revenue: number;
};

type HourlyOrders = {
    name: string;
    orders: number;
};

type RestaurantDistribution = {
    name: string;
    value: number;
};

type TopItem = {
    name: string;
    count: number;
    revenue: number;
};

export default function ReportsPage() {
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<PeriodType>('7d');
    const [exporting, setExporting] = useState(false);

    const [stats, setStats] = useState<ReportStats>({
        revenue: 0, orderCount: 0, uniqueTables: 0, avgBasket: 0, revenueTrend: 0, orderTrend: 0
    });

    const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
    const [hourlyOrders, setHourlyOrders] = useState<HourlyOrders[]>([]);
    const [restaurantDistribution, setRestaurantDistribution] = useState<RestaurantDistribution[]>([]);
    const [topItems, setTopItems] = useState<TopItem[]>([]);

    const getDateRange = useCallback((p: PeriodType) => {
        const now = new Date();
        const end = now.toISOString();
        let start: Date;

        switch (p) {
            case '24h': start = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
            case '7d': start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
            case '30d': start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
            case 'year': start = new Date(now.getFullYear(), 0, 1); break;
            default: start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }
        return { start: start.toISOString(), end };
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        const { start, end } = getDateRange(period);
        try {
            const [ordersRes, allItemsRes] = await Promise.all([
                supabase.from('orders').select('created_at, total_price, table_number').gte('created_at', start).lte('created_at', end),
                supabase.from('order_items').select('quantity, price_at_order, orders!inner(created_at), menu_items!inner(name, restaurants(name))').gte('orders.created_at', start).lte('orders.created_at', end)
            ]);

            const currentOrders = ordersRes.data || [];
            const currentRevenue = currentOrders.reduce((s, o) => s + (o.total_price || 0), 0);
            const uniqueTables = new Set(currentOrders.map(o => o.table_number).filter(Boolean)).size;

            setStats(prev => ({
                ...prev,
                revenue: currentRevenue,
                orderCount: currentOrders.length,
                uniqueTables,
                avgBasket: currentOrders.length > 0 ? Math.round(currentRevenue / currentOrders.length) : 0
            }));

            // Daily Revenue Logic
            const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
            const revMap: Record<string, number> = {};
            currentOrders.forEach(o => {
                const date = new Date(o.created_at);
                const key = period === '24h' ? `${date.getHours()}h` : dayNames[date.getDay()];
                revMap[key] = (revMap[key] || 0) + (o.total_price || 0);
            });
            setDailyRevenue(period === '24h' ? Array.from({ length: 24 }, (_, i) => ({ name: `${i}h`, revenue: revMap[`${i}h`] || 0 })) : dayNames.map(n => ({ name: n, revenue: revMap[n] || 0 })));

            // Top Items
            const itemsMap: Record<string, { c: number, r: number }> = {};
            const distMap: Record<string, number> = {};
            (allItemsRes.data || []).forEach((item: any) => {
                const name = item.menu_items?.name || 'Article';
                const qty = item.quantity || 1;
                const rev = qty * (item.price_at_order || 0);
                if (!itemsMap[name]) itemsMap[name] = { c: 0, r: 0 };
                itemsMap[name].c += qty;
                itemsMap[name].r += rev;

                const resto = item.menu_items?.restaurants?.name || 'Autre';
                distMap[resto] = (distMap[resto] || 0) + rev;
            });
            setTopItems(Object.entries(itemsMap).map(([name, d]) => ({ name, count: d.c, revenue: d.r })).sort((a, b) => b.count - a.count).slice(0, 10));
            setRestaurantDistribution(Object.entries(distMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value));

        } catch (e) {
            toast.error('Erreur de chargement');
        } finally {
            setLoading(false);
        }
    }, [period, getDateRange]);

    useEffect(() => { loadData(); }, [loadData]);

    const exportPDF = () => {
        setExporting(true);
        try {
            const doc = new jsPDF();
            const primaryColor = [0, 48, 88]; // #003058
            const accentColor = [197, 160, 101]; // #C5A065

            // Background & Border
            doc.setFillColor(252, 252, 252);
            doc.rect(0, 0, 210, 297, 'F');
            doc.setDrawColor(240, 240, 240);
            doc.rect(10, 10, 190, 277, 'S');

            // Header
            doc.setFont("helvetica", "bold");
            doc.setFontSize(28);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text("RAPPORT RADISSON BLU", 20, 35);

            doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
            doc.setLineWidth(2);
            doc.line(20, 42, 70, 42);

            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            doc.text("HOTEL N'DJAMENA • GESTION EXECUTIVE", 20, 48);

            // Metadata Box
            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.rect(140, 20, 50, 25, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.text("Période :", 145, 28);
            doc.setFontSize(10);
            doc.text(period.toUpperCase(), 145, 35);
            doc.setFontSize(8);
            doc.text("Généré le : " + new Date().toLocaleDateString('fr-FR'), 145, 42);

            // Summary Grid
            const gridY = 70;
            doc.setDrawColor(230, 230, 230);
            doc.setLineWidth(0.1);

            const drawMetric = (x: number, y: number, label: string, value: string) => {
                doc.setFillColor(255, 255, 255);
                doc.rect(x, y, 42, 25, 'FD');
                doc.setFontSize(7);
                doc.setTextColor(150, 150, 150);
                doc.text(label.toUpperCase(), x + 5, y + 8);
                doc.setFontSize(12);
                doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.text(value, x + 5, y + 18);
            };

            drawMetric(20, gridY, "Chiffre d'Affaires", stats.revenue.toLocaleString() + " F");
            drawMetric(65, gridY, "Commandes", stats.orderCount.toString());
            drawMetric(110, gridY, "Tables Uniques", stats.uniqueTables.toString());
            drawMetric(155, gridY, "Panier Moyen", stats.avgBasket.toLocaleString() + " F");

            // Charts Replacement - Analysis Text
            doc.setFontSize(14);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text("ANALYSE DES PERFORMANCES", 20, 115);

            doc.setFontSize(9);
            doc.setTextColor(80, 80, 80);
            doc.text("Classement des articles les plus commandés sur la période sélectionnée :", 20, 125);

            // Top Items Table
            let tableY = 135;
            doc.setFillColor(245, 245, 245);
            doc.rect(20, tableY, 170, 8, 'F');
            doc.setFont("helvetica", "bold");
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text("ARTICLE", 25, tableY + 5);
            doc.text("QTE", 120, tableY + 5);
            doc.text("REVENUS", 160, tableY + 5);

            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 100, 100);
            topItems.forEach((item, i) => {
                const y = tableY + 15 + (i * 10);
                if (i % 2 === 0) {
                    doc.setFillColor(254, 254, 254);
                    doc.rect(20, y - 6, 170, 10, 'F');
                }
                doc.text(item.name, 25, y);
                doc.text(item.count.toString(), 120, y);
                doc.text(item.revenue.toLocaleString() + " F", 160, y);
            });

            // Footer
            doc.setFontSize(8);
            doc.setTextColor(180, 180, 180);
            doc.text("Document confidentiel - Radisson Blu Proprietary Data", 105, 285, { align: 'center' });

            doc.save(`Rapport_Radisson_${period}_${Date.now()}.pdf`);
            toast.success('Document PDF généré');
        } catch (e) {
            toast.error("Erreur PDF");
        } finally {
            setExporting(false);
        }
    };

    if (loading) return <ListPageSkeleton />;

    return (
        <div className="space-y-6 pb-20 max-w-7xl mx-auto font-sans">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-xl font-bold text-foreground tracking-tight uppercase">Analyses & Rapports</h1>
                    <p className="text-muted-foreground font-medium text-xs mt-1">Données consolidées de l'établissement</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-muted p-1 rounded-md border border-border">
                        {(['24h', '7d', '30d', 'year'] as PeriodType[]).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={cn(
                                    "px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all",
                                    period === p ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {p === 'year' ? 'ANNÉE' : p.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={exportPDF}
                        disabled={exporting}
                        className="h-10 px-4 bg-primary text-primary-foreground rounded-md font-semibold text-[10px] uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-2"
                    >
                        {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                        <span>PDF</span>
                    </button>
                </div>
            </div>

            {/* Premium Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card p-6 rounded-md border border-border relative overflow-hidden transition-all hover:bg-accent/5">
                    <div className="relative z-10 space-y-4">
                        <div className="w-9 h-9 rounded-md bg-muted text-foreground flex items-center justify-center border border-border"><Wallet className="w-4.5 h-4.5" /></div>
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Revenus Totaux</p>
                            <h3 className="text-xl font-bold text-foreground tabular-nums tracking-tight">{stats.revenue.toLocaleString()} F</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-card p-6 rounded-md border border-border relative overflow-hidden transition-all hover:bg-accent/5">
                    <div className="relative z-10 space-y-4">
                        <div className="w-9 h-9 rounded-md bg-muted text-foreground flex items-center justify-center border border-border"><Package className="w-4.5 h-4.5" /></div>
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Volume Commandes</p>
                            <h3 className="text-xl font-bold text-foreground tabular-nums tracking-tight">{stats.orderCount}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-card p-6 rounded-md border border-border relative overflow-hidden transition-all hover:bg-accent/5">
                    <div className="relative z-10 space-y-4">
                        <div className="w-9 h-9 rounded-md bg-muted text-foreground flex items-center justify-center border border-border"><Users className="w-4.5 h-4.5" /></div>
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Tables Uniques</p>
                            <h3 className="text-xl font-bold text-foreground tabular-nums tracking-tight">{stats.uniqueTables}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-card p-6 rounded-md border border-border relative overflow-hidden transition-all hover:bg-accent/5">
                    <div className="relative z-10 space-y-4">
                        <div className="w-9 h-9 rounded-md bg-muted text-foreground flex items-center justify-center border border-border"><TrendingUp className="w-4.5 h-4.5" /></div>
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Panier Moyen</p>
                            <h3 className="text-xl font-bold text-foreground tabular-nums tracking-tight">{stats.avgBasket.toLocaleString()} F</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 bg-card p-6 rounded-md border border-border">
                    <div className="mb-8">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Évolution Temporelle</h2>
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-1">Revenus générés par {period === '24h' ? 'heure' : 'jour'}</p>
                    </div>
                    <div className="h-[350px]">
                        <RevenueChart data={dailyRevenue} />
                    </div>
                </div>

                <div className="lg:col-span-4 bg-card p-6 rounded-md border border-border">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-8">Répartition Cartes</h2>
                    <div className="h-[300px]">
                        <CategoryPieChart data={restaurantDistribution} />
                    </div>
                </div>
            </div>

            {/* Ranking Section */}
            <div className="bg-card p-8 rounded-md border border-border font-sans">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-11 h-11 bg-muted rounded-md border border-border flex items-center justify-center"><Trophy className="w-5 h-5 text-amber-500" /></div>
                    <div>
                        <h2 className="text-lg font-bold text-foreground tracking-tight">Top 10 des Ventes</h2>
                        <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">Plats ayant générés le plus de volume</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {topItems.map((item, id) => (
                        <div key={id} className="flex items-center justify-between p-4 bg-muted/20 border border-border rounded-md hover:bg-accent/5 transition-all group">
                            <div className="flex items-center gap-4">
                                <span className="text-xl font-bold text-muted-foreground/30 tabular-nums">{id + 1}</span>
                                <div>
                                    <p className="font-bold text-xs uppercase tracking-tight text-foreground">{item.name}</p>
                                    <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">{item.count} unités vendues</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-primary tabular-nums">{item.revenue.toLocaleString()} F</p>
                                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/50 ml-auto mt-0.5" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ListPageSkeleton() {
    return (
        <div className="p-8 space-y-10 animate-pulse">
            <div className="h-20 bg-gray-100 rounded-2xl w-1/3" />
            <div className="grid grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-50 rounded-[2rem]" />)}
            </div>
            <div className="h-96 bg-gray-50 rounded-[2.5rem]" />
        </div>
    );
}
