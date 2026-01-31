'use client';

import { useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    Eye,
    MousePointer,
    ArrowUpRight,
    Brain,
    Calendar,
    Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Mock Data for Visual Demo (In real app, fetch from GSC & Memory)
const MOCK_ANALYTICS = [
    { date: '2024-01-01', clicks: 400, impressions: 2400, ctr: 16.6, position: 12.1, anomaly: false },
    { date: '2024-01-02', clicks: 300, impressions: 1398, ctr: 21.4, position: 11.8, anomaly: false },
    { date: '2024-01-03', clicks: 200, impressions: 9800, ctr: 2.0, position: 14.5, anomaly: true, insight: "Algorithmic turbulence detected in SERP." },
    { date: '2024-01-04', clicks: 278, impressions: 3908, ctr: 7.1, position: 13.2, anomaly: false },
    { date: '2024-01-05', clicks: 189, impressions: 4800, ctr: 3.9, position: 12.9, anomaly: false },
    { date: '2024-01-06', clicks: 239, impressions: 3800, ctr: 6.2, position: 12.5, anomaly: false },
    { date: '2024-01-07', clicks: 349, impressions: 4300, ctr: 8.1, position: 12.0, anomaly: false },
];

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(false);
    const [timeRange, setTimeRange] = useState('30d');

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Intelligence Analytics</h1>
                    <p className="text-slate-500 text-sm mt-1">Cross-referencing GSC performance with Internal Skills & Memory.</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                        {['7d', '30d', '90d'].map(range => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                                    timeRange === range ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                                )}
                            >
                                {range.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <button
                        aria-label="Filter analytics"
                        className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-slate-500"
                    >
                        <Filter className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* KPI Overlays */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard
                    title="Total Clicks"
                    value="42,891"
                    change="+12.4%"
                    trend="up"
                    icon={<MousePointer className="text-blue-500" />}
                    color="blue"
                />
                <KpiCard
                    title="Impressions"
                    value="1.2M"
                    change="+8.1%"
                    trend="up"
                    icon={<Eye className="text-purple-500" />}
                    color="purple"
                />
                <KpiCard
                    title="Avg. CTR"
                    value="3.57%"
                    change="-0.4%"
                    trend="down"
                    icon={<ArrowUpRight className="text-emerald-500" />}
                    color="emerald"
                />
                <KpiCard
                    title="Avg. Position"
                    value="11.4"
                    change="+0.8"
                    trend="up"
                    icon={<TrendingUp className="text-orange-500" />}
                    color="orange"
                />
            </div>

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Primary Traffic Chart */}
                <div className="lg:col-span-2 p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold text-slate-900">Traffic Velocity</h3>
                        <div className="flex items-center gap-4 text-xs font-semibold">
                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /> Clicks</span>
                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-200" /> Impressions</span>
                        </div>
                    </div>

                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={MOCK_ANALYTICS}>
                                <defs>
                                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    dx={-10}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="impressions"
                                    stroke="#bfdbfe"
                                    fillOpacity={0.1}
                                    fill="#bfdbfe"
                                    strokeWidth={2}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="clicks"
                                    stroke="#3b82f6"
                                    fillOpacity={1}
                                    fill="url(#colorClicks)"
                                    strokeWidth={3}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Brain Insight Sidebar */}
                <div className="flex flex-col gap-6">
                    <div className="p-6 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] text-white shadow-xl shadow-blue-500/20">
                        <div className="flex items-center gap-2 mb-4">
                            <Brain className="w-5 h-5 text-indigo-200" />
                            <h3 className="text-sm font-bold tracking-wider uppercase">Institutional Memory</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                                <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest block mb-1">Recent Promotion</span>
                                <p className="text-xs font-medium leading-relaxed">
                                    "Internal Link Recirculation" promoted to Skill Library after 0.82 success score on 4/4 URLs.
                                </p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                                <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest block mb-1">Strategy Bias</span>
                                <p className="text-xs font-medium leading-relaxed">
                                    System currently favors **Bottom-of-Funnel** optimization based on recent conversion spikes.
                                </p>
                            </div>
                        </div>
                        <button className="w-full mt-6 py-3 rounded-xl bg-white text-indigo-700 font-bold text-xs hover:bg-slate-100 transition-all">
                            View Full Skill Library
                        </button>
                    </div>

                    <div className="p-6 bg-white rounded-[2rem] border border-slate-200 flex-1">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            Recent Anomalies
                        </h3>
                        <div className="space-y-3">
                            {MOCK_ANALYTICS.filter(d => d.anomaly).map((item, i) => (
                                <div key={i} className="flex gap-3 p-3 rounded-2xl bg-orange-50 border border-orange-100">
                                    <div className="w-2 h-2 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                                    <div>
                                        <span className="text-[10px] font-bold text-orange-600 uppercase mb-0.5 block">{item.date}</span>
                                        <p className="text-[11px] text-slate-700 leading-tight font-medium">{item.insight}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KpiCard({ title, value, change, trend, icon, color }: any) {
    return (
        <div className="p-6 bg-white rounded-[2rem] border border-slate-200 shadow-sm group hover:shadow-md transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                    `bg-${color}-50`
                )}>
                    {icon}
                </div>
                <div className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-bold",
                    trend === 'up' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                    {change}
                </div>
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
            </div>
        </div>
    );
}

function CustomTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 mb-2 tracking-widest uppercase">{label}</p>
                <div className="space-y-1">
                    {payload.map((entry: any, i: number) => (
                        <div key={i} className="flex items-center justify-between gap-8">
                            <span className="text-xs text-slate-300 font-medium">{entry.name}</span>
                            <span className="text-xs font-bold">{entry.value.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
                {payload[0].payload.anomaly && (
                    <div className="mt-3 pt-3 border-t border-slate-800 flex items-start gap-2">
                        <Brain className="w-3.5 h-3.5 text-blue-400 mt-0.5" />
                        <p className="text-[10px] text-slate-400 leading-tight">{payload[0].payload.insight}</p>
                    </div>
                )}
            </div>
        );
    }
    return null;
}
