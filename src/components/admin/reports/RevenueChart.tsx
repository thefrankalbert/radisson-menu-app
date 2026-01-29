"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";

type DailyRevenue = {
    name: string;
    revenue: number;
};

interface RevenueChartProps {
    data: DailyRevenue[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 500, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 500, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderRadius: '8px',
                        border: '1px solid hsl(var(--border))',
                        boxShadow: 'none'
                    }}
                />
                <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                    activeDot={{ r: 6, stroke: '#FFF', strokeWidth: 3 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
