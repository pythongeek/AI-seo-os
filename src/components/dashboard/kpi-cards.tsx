'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface KPICardProps {
    title: string;
    value: string;
    change: number;
    data: { val: number }[];
    label: string;
}

function Sparkline({ data, color }: { data: any[], color: string }) {
    return (
        <div className="h-8 w-16">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <Line
                        type="monotone"
                        dataKey="val"
                        stroke={color}
                        strokeWidth={1.5}
                        dot={false}
                        isAnimationActive={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export interface KPIProps {
    metrics: {
        clicks: { value: number; change: number };
        impressions: { value: number; change: number };
        ctr: { value: number; change: number };
        position: { value: number; change: number };
    };
    sparklineData: { date: string; clicks: number; impressions: number; position: number }[];
}

export function KPICards({ data }: { data: KPIProps }) {
    if (!data || !data.metrics) return null;

    const { metrics, sparklineData } = data;

    const cards = [
        {
            title: 'CLICKS_30D',
            value: metrics.clicks.value.toLocaleString(),
            change: metrics.clicks.change,
            label: 'TOTAL_TRAFFIC',
            color: '#10b981',
            sparkKey: 'clicks'
        },
        {
            title: 'IMPRESSIONS',
            value: (metrics.impressions.value / 1000).toFixed(1) + 'K', // Simple formatting
            change: metrics.impressions.change,
            label: 'SERP_EXPOSURE',
            color: '#06b6d4',
            sparkKey: 'impressions'
        },
        {
            title: 'AVG_CTR',
            value: metrics.ctr.value.toFixed(1) + '%',
            change: metrics.ctr.change,
            label: 'CLICK_THROUGH',
            color: '#8b5cf6',
            sparkKey: 'clicks' // Proxy for now, or fetch separate
        },
        {
            title: 'AVG_POS',
            value: metrics.position.value.toFixed(1),
            change: metrics.position.change * -1, // Inver logic for position (lower is better)
            label: 'RANK_STABILITY',
            color: '#3b82f6',
            sparkKey: 'position'
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((m) => {
                // Prepare sparkline for this metric
                const sparkData = sparklineData.map(d => ({
                    val: m.sparkKey === 'position' ? d.position * -1 : (d as any)[m.sparkKey]
                }));

                return (
                    <div key={m.title} className="bg-zinc-950 border border-slate-800 rounded p-4 flex flex-col justify-between transition-all hover:border-slate-700 group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest">{m.title}</span>
                                <span className="text-[9px] font-mono text-slate-600 tracking-tighter uppercase">{m.label}</span>
                            </div>
                            <Sparkline data={sparkData} color={m.color} />
                        </div>

                        <div className="flex items-end justify-between">
                            <span className="text-2xl font-bold font-mono text-slate-100 tracking-tighter tabular-nums">{m.value}</span>
                            <div className={cn(
                                "flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-sm",
                                m.change > 0 ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"
                            )}>
                                {m.change > 0 ? <TrendingUp className="w-3 h-3" /> : m.change < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                {Math.abs(m.change).toFixed(1)}%
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
