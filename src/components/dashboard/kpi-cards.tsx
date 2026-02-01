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

export function KPICards() {
    // Mock data for initial UI deployment
    const metrics = [
        { title: 'CLICKS_30D', value: '14,293', change: 12.5, label: 'TOTAL_TRAFFIC', color: '#10b981' },
        { title: 'AVG_POS', value: '18.4', change: -2.1, label: 'RANK_VELOCITY', color: '#3b82f6' },
        { title: 'IMPRESSIONS', value: '821K', change: 4.2, label: 'SERP_EXPOSURE', color: '#06b6d4' },
        { title: 'INDEX_COVERAGE', value: '98.2%', change: 0.1, label: 'CRAWL_EFFICIENCY', color: '#10b981' },
    ];

    const mockData = Array.from({ length: 10 }).map((_, i) => ({ val: Math.random() * 100 }));

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((m) => (
                <div key={m.title} className="bg-zinc-950 border border-slate-800 rounded p-4 flex flex-col justify-between transition-all hover:border-slate-700 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest">{m.title}</span>
                            <span className="text-[9px] font-mono text-slate-600 tracking-tighter uppercase">{m.label}</span>
                        </div>
                        <Sparkline data={mockData} color={m.color} />
                    </div>

                    <div className="flex items-end justify-between">
                        <span className="text-2xl font-bold font-mono text-slate-100 tracking-tighter tabular-nums">{m.value}</span>
                        <div className={cn(
                            "flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-sm",
                            m.change > 0 ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"
                        )}>
                            {m.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {Math.abs(m.change)}%
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
