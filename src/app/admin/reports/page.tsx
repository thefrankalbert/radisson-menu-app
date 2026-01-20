"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Download,
    TrendingUp,
    Users,
    ShoppingBag,
    DollarSign,
    Loader2,
    FileSpreadsheet,
    FileText,
    Trophy
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell
} from "recharts";
import { supabase } from "@/lib/supabase";
import StatsCard from "@/components/admin/StatsCard";
import { toast } from "react-hot-toast";
import { jsPDF } from "jspdf";

const COLORS = ['#003058', '#C5A065', '#22C55E', '#3B82F6', '#6366F1'];

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
        revenue: 0,
        orderCount: 0,
        uniqueTables: 0,
        avgBasket: 0,
        revenueTrend: 0,
        orderTrend: 0
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
            case '24h':
                start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'year':
                start = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        return { start: start.toISOString(), end };
    }, []);

    const loadStats = useCallback(async () => {
        const { start, end } = getDateRange(period);
        const previousStart = new Date(new Date(start).getTime() - (new Date(end).getTime() - new Date(start).getTime())).toISOString();

        try {
            const { data: currentOrders } = await supabase
                .from('orders')
                .select('id, total_price, table_number')
                .gte('created_at', start)
                .lte('created_at', end);

            const { data: previousOrders } = await supabase
                .from('orders')
                .select('id, total_price')
                .gte('created_at', previousStart)
                .lt('created_at', start);

            const currentRevenue = currentOrders?.reduce((sum, o) => sum + (o.total_price || 0), 0) || 0;
            const previousRevenue = previousOrders?.reduce((sum, o) => sum + (o.total_price || 0), 0) || 0;
            const currentCount = currentOrders?.length || 0;
            const previousCount = previousOrders?.length || 0;

            const uniqueTables = new Set(currentOrders?.map(o => o.table_number).filter(Boolean)).size;
            const avgBasket = currentCount > 0 ? Math.round(currentRevenue / currentCount) : 0;

            const revenueTrend = previousRevenue > 0
                ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
                : 0;
            const orderTrend = previousCount > 0
                ? Math.round(((currentCount - previousCount) / previousCount) * 100)
                : 0;

            setStats({
                revenue: currentRevenue,
                orderCount: currentCount,
                uniqueTables,
                avgBasket,
                revenueTrend,
                orderTrend
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }, [period, getDateRange]);

    const loadDailyRevenue = useCallback(async () => {
        const { start, end } = getDateRange(period);

        try {
            const { data: orders } = await supabase
                .from('orders')
                .select('created_at, total_price')
                .gte('created_at', start)
                .lte('created_at', end)
                .order('created_at');

            const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
            const revenueByDay: Record<string, number> = {};

            orders?.forEach(order => {
                const date = new Date(order.created_at);
                const dayKey = period === '24h'
                    ? `${date.getHours()}h`
                    : dayNames[date.getDay()];
                revenueByDay[dayKey] = (revenueByDay[dayKey] || 0) + (order.total_price || 0);
            });

            let chartData: DailyRevenue[];
            if (period === '24h') {
                chartData = Array.from({ length: 24 }, (_, i) => ({
                    name: `${i}h`,
                    revenue: revenueByDay[`${i}h`] || 0
                })).filter(d => d.revenue > 0 || [12, 13, 19, 20, 21].includes(parseInt(d.name)));
            } else {
                chartData = dayNames.map(day => ({
                    name: day,
                    revenue: revenueByDay[day] || 0
                }));
            }

            setDailyRevenue(chartData);
        } catch (error) {
            console.error('Error loading daily revenue:', error);
        }
    }, [period, getDateRange]);

    const loadHourlyOrders = useCallback(async () => {
        const { start, end } = getDateRange(period);

        try {
            const { data: orders } = await supabase
                .from('orders')
                .select('created_at')
                .gte('created_at', start)
                .lte('created_at', end);

            const ordersByHour: Record<string, number> = {};
            orders?.forEach(order => {
                const hour = new Date(order.created_at).getHours();
                const key = `${hour}h`;
                ordersByHour[key] = (ordersByHour[key] || 0) + 1;
            });

            const hours = [11, 12, 13, 14, 15, 19, 20, 21, 22, 23];
            const chartData = hours.map(h => ({
                name: `${h}h`,
                orders: ordersByHour[`${h}h`] || 0
            }));

            setHourlyOrders(chartData);
        } catch (error) {
            console.error('Error loading hourly orders:', error);
        }
    }, [period, getDateRange]);

    const loadRestaurantDistribution = useCallback(async () => {
        const { start, end } = getDateRange(period);

        try {
            const { data: orderItems } = await supabase
                .from('order_items')
                .select(`
                    quantity,
                    price_at_order,
                    orders!inner (created_at),
                    menu_items!inner (
                        restaurants (name)
                    )
                `)
                .gte('orders.created_at', start)
                .lte('orders.created_at', end);

            const revenueByRestaurant: Record<string, number> = {};
            orderItems?.forEach((item: any) => {
                const restaurantName = item.menu_items?.restaurants?.name || 'Autre';
                const revenue = (item.quantity || 1) * (item.price_at_order || 0);
                revenueByRestaurant[restaurantName] = (revenueByRestaurant[restaurantName] || 0) + revenue;
            });

            const chartData = Object.entries(revenueByRestaurant)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5);

            setRestaurantDistribution(chartData);
        } catch (error) {
            console.error('Error loading restaurant distribution:', error);
        }
    }, [period, getDateRange]);

    // Charger le Top 10 des plats
    const loadTopItems = useCallback(async () => {
        const { start, end } = getDateRange(period);

        try {
            const { data: orderItems } = await supabase
                .from('order_items')
                .select(`
                    quantity,
                    price_at_order,
                    orders!inner (created_at),
                    menu_items!inner (name)
                `)
                .gte('orders.created_at', start)
                .lte('orders.created_at', end);

            const itemStats: Record<string, { count: number; revenue: number }> = {};
            orderItems?.forEach((item: any) => {
                const itemName = item.menu_items?.name || 'Article';
                const qty = item.quantity || 1;
                const revenue = qty * (item.price_at_order || 0);

                if (!itemStats[itemName]) {
                    itemStats[itemName] = { count: 0, revenue: 0 };
                }
                itemStats[itemName].count += qty;
                itemStats[itemName].revenue += revenue;
            });

            const topData = Object.entries(itemStats)
                .map(([name, data]) => ({ name, ...data }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);

            setTopItems(topData);
        } catch (error) {
            console.error('Error loading top items:', error);
        }
    }, [period, getDateRange]);

    const loadAllData = useCallback(async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadStats(),
                loadDailyRevenue(),
                loadHourlyOrders(),
                loadRestaurantDistribution(),
                loadTopItems()
            ]);
        } catch (error) {
            toast.error('Erreur lors du chargement des rapports');
        } finally {
            setLoading(false);
        }
    }, [loadStats, loadDailyRevenue, loadHourlyOrders, loadRestaurantDistribution, loadTopItems]);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    const formatPrice = (price: number) => {
        if (price >= 1000000) {
            return `${(price / 1000000).toFixed(1)}M F`;
        } else if (price >= 1000) {
            return `${Math.round(price / 1000)}K F`;
        }
        return `${price.toLocaleString()} F`;
    };

    // Export CSV
    const exportCSV = () => {
        setExporting(true);
        try {
            const periodLabels: Record<PeriodType, string> = {
                '24h': 'Dernières 24h',
                '7d': '7 derniers jours',
                '30d': '30 derniers jours',
                'year': 'Année en cours'
            };

            let csvContent = "data:text/csv;charset=utf-8,";

            // En-tête
            csvContent += "RAPPORT RADISSON BLU - " + periodLabels[period] + "\n\n";

            // Stats générales
            csvContent += "STATISTIQUES GENERALES\n";
            csvContent += "Chiffre d'Affaires," + stats.revenue + " FCFA\n";
            csvContent += "Nombre de Commandes," + stats.orderCount + "\n";
            csvContent += "Tables Uniques," + stats.uniqueTables + "\n";
            csvContent += "Panier Moyen," + stats.avgBasket + " FCFA\n\n";

            // Top 10 plats
            csvContent += "TOP 10 PLATS\n";
            csvContent += "Rang,Nom,Quantite Vendue,Revenus FCFA\n";
            topItems.forEach((item, idx) => {
                csvContent += `${idx + 1},${item.name},${item.count},${item.revenue}\n`;
            });
            csvContent += "\n";

            // Revenus par jour
            csvContent += "REVENUS PAR JOUR\n";
            csvContent += "Jour,Revenus FCFA\n";
            dailyRevenue.forEach(day => {
                csvContent += `${day.name},${day.revenue}\n`;
            });
            csvContent += "\n";

            // Distribution par carte
            csvContent += "REPARTITION PAR CARTE\n";
            csvContent += "Carte,Revenus FCFA\n";
            restaurantDistribution.forEach(r => {
                csvContent += `${r.name},${r.value}\n`;
            });

            // Télécharger
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `rapport-radisson-${period}-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success('Export CSV réussi');
        } catch (error) {
            toast.error("Erreur lors de l'export CSV");
        } finally {
            setExporting(false);
        }
    };

    // Export PDF
    const exportPDF = () => {
        setExporting(true);
        try {
            const doc = new jsPDF();
            const periodLabels: Record<PeriodType, string> = {
                '24h': 'Dernières 24h',
                '7d': '7 derniers jours',
                '30d': '30 derniers jours',
                'year': 'Année en cours'
            };

            // Titre
            doc.setFontSize(20);
            doc.setTextColor(0, 48, 88); // #003058
            doc.text("RAPPORT RADISSON BLU", 20, 20);

            doc.setFontSize(12);
            doc.setTextColor(100);
            doc.text(`Période: ${periodLabels[period]}`, 20, 30);
            doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 20, 37);

            // Ligne séparatrice
            doc.setDrawColor(197, 160, 101); // #C5A065
            doc.setLineWidth(0.5);
            doc.line(20, 42, 190, 42);

            // Stats
            doc.setFontSize(14);
            doc.setTextColor(0, 48, 88);
            doc.text("Statistiques Générales", 20, 55);

            doc.setFontSize(11);
            doc.setTextColor(60);
            doc.text(`Chiffre d'Affaires: ${stats.revenue.toLocaleString()} FCFA`, 25, 65);
            doc.text(`Nombre de Commandes: ${stats.orderCount}`, 25, 72);
            doc.text(`Tables Uniques: ${stats.uniqueTables}`, 25, 79);
            doc.text(`Panier Moyen: ${stats.avgBasket.toLocaleString()} FCFA`, 25, 86);

            // Top 10
            doc.setFontSize(14);
            doc.setTextColor(0, 48, 88);
            doc.text("Top 10 Plats les Plus Commandés", 20, 100);

            doc.setFontSize(10);
            doc.setTextColor(60);
            topItems.forEach((item, idx) => {
                const y = 110 + (idx * 7);
                doc.text(`${idx + 1}. ${item.name}`, 25, y);
                doc.text(`${item.count} vendus`, 120, y);
                doc.text(`${item.revenue.toLocaleString()} FCFA`, 160, y);
            });

            // Distribution
            const distY = 185;
            doc.setFontSize(14);
            doc.setTextColor(0, 48, 88);
            doc.text("Répartition par Carte", 20, distY);

            doc.setFontSize(10);
            doc.setTextColor(60);
            restaurantDistribution.forEach((r, idx) => {
                const y = distY + 10 + (idx * 7);
                doc.text(`${r.name}: ${r.value.toLocaleString()} FCFA`, 25, y);
            });

            // Footer
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text("Radisson Blu Hotel N'Djamena - Dashboard Admin", 20, 285);

            // Télécharger
            doc.save(`rapport-radisson-${period}-${new Date().toISOString().split('T')[0]}.pdf`);

            toast.success('Export PDF réussi');
        } catch (error) {
            toast.error("Erreur lors de l'export PDF");
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-12 h-12 text-[#C5A065] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#003058] tracking-tight">Analyse & Rapports</h1>
                    <p className="text-slate-400 mt-2 font-medium">Suivez la performance de vos restaurants en temps réel.</p>
                </div>

                <div className="flex items-center space-x-3">
                    {/* Period selector */}
                    <div className="flex items-center space-x-1 bg-white p-1.5 rounded-2xl border border-[#F5F5F5] shadow-sm">
                        {(['24h', '7d', '30d', 'year'] as PeriodType[]).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${period === p
                                    ? 'bg-[#003058] text-white shadow-lg'
                                    : 'text-slate-400 hover:bg-slate-50'
                                    }`}
                            >
                                {p === 'year' ? 'AN' : p.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    {/* Export buttons */}
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={exportCSV}
                            disabled={exporting}
                            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-xs hover:bg-emerald-600 transition-colors disabled:opacity-50"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>CSV</span>
                        </button>
                        <button
                            onClick={exportPDF}
                            disabled={exporting}
                            className="flex items-center space-x-2 px-4 py-2.5 bg-[#C5A065] text-white rounded-xl font-bold text-xs hover:bg-[#b08e5a] transition-colors disabled:opacity-50"
                        >
                            <FileText className="w-4 h-4" />
                            <span>PDF</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Chiffre d'Affaires"
                    value={formatPrice(stats.revenue)}
                    icon={DollarSign}
                    trend={{ value: Math.abs(stats.revenueTrend), isPositive: stats.revenueTrend >= 0 }}
                    color="blue"
                />
                <StatsCard
                    title="Commandes"
                    value={stats.orderCount.toString()}
                    icon={ShoppingBag}
                    trend={{ value: Math.abs(stats.orderTrend), isPositive: stats.orderTrend >= 0 }}
                    color="gold"
                />
                <StatsCard
                    title="Tables Uniques"
                    value={stats.uniqueTables.toString()}
                    icon={Users}
                    color="blue"
                />
                <StatsCard
                    title="Panier Moyen"
                    value={formatPrice(stats.avgBasket)}
                    icon={TrendingUp}
                    color="green"
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Revenue Line Chart */}
                <div className="lg:col-span-8 bg-white rounded-[2.5rem] p-8 border border-[#F5F5F5] shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="font-black text-[#003058] text-lg">Évolution des revenus</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 italic">
                                {period === '24h' ? 'Par heure' : 'Par jour'}
                            </p>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        {dailyRevenue.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={dailyRevenue} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F5F5F5" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94A3B8' }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94A3B8' }}
                                        tickFormatter={(v) => v >= 1000 ? `${v / 1000}K` : v}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value) => [`${Number(value || 0).toLocaleString()} FCFA`, 'Revenus']}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#C5A065"
                                        strokeWidth={4}
                                        dot={{ fill: '#C5A065', strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 8, stroke: '#FFFFFF', strokeWidth: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400">
                                Aucune donnée pour cette période
                            </div>
                        )}
                    </div>
                </div>

                {/* Distribution Pie Chart */}
                <div className="lg:col-span-4 bg-white rounded-[2.5rem] p-8 border border-[#F5F5F5] shadow-sm">
                    <h3 className="font-black text-[#003058] text-lg mb-8 text-center">Répartition par Carte</h3>
                    <div className="h-[300px] w-full">
                        {restaurantDistribution.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={restaurantDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {restaurantDistribution.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `${Number(value || 0).toLocaleString()} FCFA`} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400">
                                Aucune donnée
                            </div>
                        )}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        {restaurantDistribution.map((item, id) => (
                            <div key={id} className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[id % COLORS.length] }} />
                                <span className="text-[10px] font-bold text-slate-500 truncate">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top 10 Plats */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-[#F5F5F5] shadow-sm">
                <div className="flex items-center space-x-3 mb-8">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-[#C5A065]" />
                    </div>
                    <div>
                        <h3 className="font-black text-[#003058] text-lg">Top 10 Plats les Plus Commandés</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Classement par quantité vendue</p>
                    </div>
                </div>

                {topItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {topItems.map((item, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-[#F5F5F5] group hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${idx < 3
                                        ? 'bg-[#C5A065] text-white'
                                        : 'bg-slate-200 text-slate-600'
                                        }`}>
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#003058] text-sm">{item.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                            {item.count} vendus
                                        </p>
                                    </div>
                                </div>
                                <span className="font-black text-[#003058]">
                                    {item.revenue.toLocaleString()} F
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-400">
                        Aucune donnée disponible pour cette période
                    </div>
                )}
            </div>

            {/* Charts Row 2 - Heures de pointe */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-[#F5F5F5] shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="font-black text-[#003058] text-lg">Heures de pointe</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Nombre de commandes par tranche horaire</p>
                    </div>
                </div>
                <div className="h-[250px] w-full">
                    {hourlyOrders.some(h => h.orders > 0) ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hourlyOrders}>
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94A3B8' }}
                                />
                                <Tooltip cursor={{ fill: '#F5F5F5' }} />
                                <Bar
                                    dataKey="orders"
                                    fill="#003058"
                                    radius={[8, 8, 0, 0]}
                                    barSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400">
                            Aucune commande pour cette période
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
