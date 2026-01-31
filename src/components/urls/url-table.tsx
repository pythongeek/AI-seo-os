'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useState } from 'react';

// Priority Tiers
const getTier = (score: number) => {
    if (score >= 0.9) return { label: 'CRITICAL', color: 'text-rose-500 border-rose-900 bg-rose-950/30' };
    if (score >= 0.7) return { label: 'HIGH', color: 'text-amber-500 border-amber-900 bg-amber-950/30' };
    if (score >= 0.4) return { label: 'MEDIUM', color: 'text-sky-500 border-sky-900 bg-sky-950/30' };
    return { label: 'LOW', color: 'text-zinc-500 border-zinc-800 bg-zinc-900/30' };
};

export default function UrlTable({ urls }: { urls: any[] }) {
    const parentRef = useRef<HTMLDivElement>(null);
    const [filter, setFilter] = useState('ALL');

    // Simple client-side filter
    const filteredUrls = urls.filter(u => {
        if (filter === 'ALL') return true;
        const score = Number(u.seoPriorityScore);
        if (filter === 'CRITICAL') return score >= 0.9;
        if (filter === 'HIGH') return score >= 0.7 && score < 0.9;
        return true;
    });

    const rowVirtualizer = useVirtualizer({
        count: filteredUrls.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 40, // Pixel height of row
        overscan: 5,
    });

    return (
        <div className="flex flex-col h-[600px] border border-zinc-800 rounded bg-zinc-950 text-xs font-mono">
            {/* Toolbar */}
            <div className="flex items-center gap-2 p-2 border-b border-zinc-800 bg-zinc-900/50">
                <span className="text-zinc-500 px-2">FILTER:</span>
                {['ALL', 'CRITICAL', 'HIGH'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1 border rounded ${filter === f ? 'bg-zinc-700 text-white border-zinc-500' : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                    >
                        {f}
                    </button>
                ))}
                <div className="ml-auto text-zinc-600 px-2">
                    COUNT: {filteredUrls.length}
                </div>
            </div>

            {/* Header */}
            <div className="grid grid-cols-12 gap-2 p-2 border-b border-zinc-800 bg-zinc-900 text-zinc-500 font-bold">
                <div className="col-span-1">SCORE</div>
                <div className="col-span-1">TIER</div>
                <div className="col-span-8">URL</div>
                <div className="col-span-2 text-right">METRICS (C/Cr/L)</div>
            </div>

            {/* Virtual Body */}
            <div
                ref={parentRef}
                className="flex-1 overflow-auto"
            >
                <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const url = filteredUrls[virtualRow.index];
                        const tier = getTier(Number(url.seoPriorityScore));

                        return (
                            <div
                                key={virtualRow.key}
                                className="absolute top-0 left-0 w-full grid grid-cols-12 gap-2 p-2 px-2 hover:bg-zinc-900/50 border-b border-zinc-800/50 transition-colors"
                                style={{
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start}px)`,
                                }}
                            >
                                <div className="col-span-1 text-zinc-300 font-bold">
                                    {Number(url.seoPriorityScore).toFixed(2)}
                                </div>
                                <div className="col-span-1">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] border ${tier.color}`}>
                                        {tier.label}
                                    </span>
                                </div>
                                <div className="col-span-8 truncate text-zinc-400" title={url.url}>
                                    {url.url}
                                </div>
                                <div className="col-span-2 text-right text-zinc-600">
                                    {/* Clicks / CrawlFreq / Links Placeholder if sparse */}
                                    - / - / -
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
