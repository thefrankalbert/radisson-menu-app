import { createClient } from "@/lib/supabase-server";
import DashboardClient from "@/components/admin/DashboardClient";
import { Order, PopularItem, DashboardStats } from "@/types/admin";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    try {
        const supabase = await createClient();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
            ordersResponse,
            itemsCountResponse,
            activeCardsResponse,
            recentOrdersResponse,
            popularItemsResponse
        ] = await Promise.all([
            supabase.from('orders')
                .select('id, total_price, status')
                .gte('created_at', today.toISOString()),
            supabase.from('menu_items')
                .select('id', { count: 'exact', head: true })
                .eq('is_available', true),
            supabase.from('restaurants')
                .select('id', { count: 'exact', head: true }),
            supabase.from('orders')
                .select(`
                    id,
                    table_number,
                    status,
                    total_price,
                    created_at,
                    order_items (
                        id, quantity, price_at_order, menu_items (name)
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(6),
            supabase.from('order_items')
                .select(`
                    menu_item_id,
                    quantity,
                    menu_items (id, name, image_url)
                `)
                .not('menu_item_id', 'is', null)
        ]);

        // 1. Stats Calculation
        const ordersData = ordersResponse.data || [];
        const ordersToday = ordersData.length;
        // Revenu uniquement sur les commandes livrées comme demandé
        const revenueToday = ordersData
            .filter(o => o.status === 'delivered')
            .reduce((sum, o) => sum + (o.total_price || 0), 0);

        const activeItems = itemsCountResponse.count || 0;
        const activeCards = activeCardsResponse.count || 0;

        const initialStats: DashboardStats = {
            ordersToday,
            revenueToday,
            activeItems,
            activeCards
        };

        // 2. Recent Orders Formatting
        const recentOrders: Order[] = (recentOrdersResponse.data || []).map((order: any) => ({
            id: order.id,
            table_number: order.table_number || 'N/A',
            status: order.status || 'pending',
            total_price: order.total_price || 0,
            created_at: order.created_at,
            items: order.order_items?.map((item: any) => ({
                id: item.id,
                name: item.menu_items?.name || 'Item inconnu',
                quantity: item.quantity,
                price: item.price_at_order
            })) || []
        }));

        // 3. Popular Items Calculation
        const itemCounts: Record<string, PopularItem> = {};
        (popularItemsResponse.data || []).forEach((item: any) => {
            if (item.menu_items) {
                const id = item.menu_item_id;
                if (!itemCounts[id]) {
                    itemCounts[id] = {
                        id,
                        name: item.menu_items.name,
                        image_url: item.menu_items.image_url,
                        order_count: 0
                    };
                }
                itemCounts[id].order_count += item.quantity;
            }
        });

        const popularItems = Object.values(itemCounts)
            .sort((a, b) => b.order_count - a.order_count)
            .slice(0, 5);

        return (
            <DashboardClient
                initialStats={initialStats}
                initialRecentOrders={recentOrders}
                initialPopularItems={popularItems}
            />
        );
    } catch (error) {
        console.error("Admin Page Error:", error);
        // Fallback UI or empty data
        return (
            <DashboardClient
                initialStats={{ ordersToday: 0, revenueToday: 0, activeItems: 0, activeCards: 0 }}
                initialRecentOrders={[]}
                initialPopularItems={[]}
            />
        );
    }
}
