import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { calculateVelocity, classifyVelocity } from "@/lib/algorithms/ranking-velocity";

// Helper to format velocity
const formatVelo = (v: number) => {
    if (v === 0) return <span className="text-slate-500 font-mono">-0.00</span>;
    if (v < 0) return <span className="text-emerald-500 font-mono font-bold tracking-tighter">+{Math.abs(v).toFixed(2)}/Δ</span>;
    return <span className="text-rose-500 font-mono font-bold tracking-tighter">-{v.toFixed(2)}/Δ</span>;
};

export async function VelocityHeatmap({ propertyId }: { propertyId: string }) {
    // Query Materialized View directly
    // Note: Drizzle doesn't have the View typed automatically unless we defined it. 
    // using db.execute implies generic result.
    // Proper way: Define a schema object for reading the view if we want type safety. 
    // Or just raw SQL select.

    // We want keywords with significant movement (velocity != 0) or just top keywords.
    // Let's grab Top 10 by 'Momentum' (Most Improved 30d)

    // Safe DB Execute Helper
    const safeExecute = async (query: any) => {
        try {
            const res: any = await db.execute(query);
            // Handle different driver responses (array vs { rows: [] })
            if (Array.isArray(res)) return res;
            if (res && Array.isArray(res.rows)) return res.rows;
            return [];
        } catch (e) {
            console.error("VelocityHeatmap Query Error:", e);
            return [];
        }
    };

    const momentumData = await safeExecute(sql`
SELECT * FROM ranking_velocity 
        WHERE property_id = ${propertyId}
        ORDER BY(current_pos - pos_30_days_ago) DESC 
        LIMIT 10
    `);

    // Let's also grab Top 10 Declines
    const riskData = await safeExecute(sql`
SELECT * FROM ranking_velocity 
        WHERE property_id = ${propertyId}
        ORDER BY(current_pos - pos_30_days_ago) DESC 
        LIMIT 10
    `);

    // Actually, let's just show a mixed list: "Top Volatility"
    const volatilityData = await safeExecute(sql`
SELECT *,
    (current_pos - pos_30_days_ago) as abs_change
        FROM ranking_velocity
        WHERE property_id = ${propertyId}
        AND pos_30_days_ago IS NOT NULL
        ORDER BY ABS(current_pos - pos_30_days_ago) DESC
        LIMIT 20
    `);

    if (volatilityData.length === 0) return <div className="text-zinc-500 p-4">No Velocity Data Available (Need &gt;7 days history)</div>;

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="border border-slate-800 bg-zinc-950 overflow-hidden rounded">
                <div className="bg-slate-900/50 px-3 py-2 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        VELOCITY_STREAM_MATRIX
                    </h3>
                    <span className="text-[9px] font-mono text-blue-500 uppercase">30D_SAMPLING_ACTIVE</span>
                </div>

                <div className="p-1 space-y-0.5 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {volatilityData.map((row: any) => {
                        const v30 = calculateVelocity(row.current_pos, row.pos_30_days_ago, 30);
                        const cls = classifyVelocity(v30);

                        return (
                            <div key={row.query} className="group flex items-center gap-4 px-3 py-1.5 hover:bg-white/[0.03] border-b border-slate-900/50 last:border-0 transition-colors">
                                <span className="font-mono text-[11px] text-slate-300 w-1/2 truncate uppercase tracking-tighter" title={row.query}>
                                    {row.query}
                                </span>

                                <div className="flex items-center gap-6 w-1/2 justify-end">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[8px] font-mono text-slate-600 leading-none mb-0.5">CUR_POS</span>
                                        <span className="text-[11px] font-mono font-bold text-slate-200 tabular-nums">
                                            {row.current_pos.toString().padStart(2, '0')}
                                        </span>
                                    </div>

                                    <div className="flex flex-col items-end w-16">
                                        <span className="text-[8px] font-mono text-slate-600 leading-none mb-0.5">V_RATE</span>
                                        <div className="text-[10px]">{formatVelo(v30)}</div>
                                    </div>

                                    <div className={cn(
                                        "w-1.5 h-6 rounded-sm shadow-sm transition-all group-hover:scale-x-125",
                                        cls === 'MOMENTUM_BUILD' ? 'bg-emerald-500 shadow-emerald-500/20' :
                                            cls === 'IMPROVEMENT' ? 'bg-emerald-500/40' :
                                                cls === 'RAPID_DECLINE' ? 'bg-rose-500 shadow-rose-500/20' :
                                                    cls === 'DECLINE' ? 'bg-rose-500/40' : 'bg-slate-800'
                                    )} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="border border-slate-800 bg-zinc-950 rounded flex flex-col overflow-hidden">
                <div className="bg-slate-900/50 px-3 py-2 border-b border-slate-800">
                    <h3 className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-[0.2em]">INTEL_SIGNAL_HEATMAP</h3>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="grid grid-cols-5 gap-2 opacity-20 group">
                        {Array.from({ length: 25 }).map((_, i) => (
                            <div key={i} className={cn(
                                "w-4 h-4 rounded-sm transition-all duration-300",
                                i % 3 === 0 ? "bg-emerald-500 group-hover:bg-emerald-400" :
                                    i % 4 === 0 ? "bg-rose-500 group-hover:bg-rose-400" : "bg-slate-800"
                            )} />
                        ))}
                    </div>
                    <p className="text-[10px] font-mono text-slate-600 max-w-[200px] uppercase leading-relaxed tracking-wider">
                        Awaiting recursive sensory feedback from rank_velocity_kernel...
                    </p>
                </div>
            </div>
        </div>
    );
}
