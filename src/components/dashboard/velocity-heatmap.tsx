import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { calculateVelocity, classifyVelocity } from "@/lib/algorithms/ranking-velocity";

// Helper to format velocity
const formatVelo = (v: number) => {
    if (v === 0) return <span className="text-zinc-500">-</span>;
    if (v < 0) return <span className="text-emerald-500">+{Math.abs(v)}/d</span>; // Negative val = improvement
    return <span className="text-rose-500">-{v}/d</span>;
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
        ORDER BY (current_pos - pos_30_days_ago) DESC 
        LIMIT 10
    `);

    // Let's also grab Top 10 Declines
    const riskData = await safeExecute(sql`
        SELECT * FROM ranking_velocity 
        WHERE property_id = ${propertyId}
        ORDER BY (current_pos - pos_30_days_ago) DESC 
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-zinc-800 rounded bg-zinc-900/30">
                <h3 className="text-sm text-zinc-400 font-bold mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    VELOCITY_MATRIX (30D)
                </h3>

                <div className="space-y-3">
                    {volatilityData.map((row: any) => {
                        const v30 = calculateVelocity(row.current_pos, row.pos_30_days_ago, 30);
                        const cls = classifyVelocity(v30);
                        const change = row.pos_30_days_ago - row.current_pos; // Positive = Improvement

                        return (
                            <div key={row.query} className="flex items-center justify-between text-xs border-b border-zinc-800/50 pb-2">
                                <span className="font-mono text-zinc-300 w-1/3 truncate" title={row.query}>{row.query}</span>

                                <div className="flex items-center gap-4 w-2/3 justify-end">
                                    <div className="text-right">
                                        <div className="text-zinc-500 text-[10px]">POS</div>
                                        <div className="font-bold">{row.current_pos} <span className="text-zinc-600">from {row.pos_30_days_ago}</span></div>
                                    </div>

                                    <div className="text-right w-20">
                                        <div className="text-zinc-500 text-[10px]">VELO</div>
                                        <div>{formatVelo(v30)}</div>
                                    </div>

                                    <div className={`w-2 h-8 rounded-sm ${cls === 'MOMENTUM_BUILD' ? 'bg-emerald-500' :
                                        cls === 'IMPROVEMENT' ? 'bg-emerald-500/50' :
                                            cls === 'RAPID_DECLINE' ? 'bg-rose-500' :
                                                cls === 'DECLINE' ? 'bg-rose-500/50' : 'bg-zinc-700'
                                        }`} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="p-4 border border-zinc-800 rounded bg-zinc-900/30 flex items-center justify-center text-zinc-500 text-xs">
                [HEATMAP_VISUALIZATION_PLACEHOLDER]
                {/* Canvas/SVG Heatmap would go here for density */}
            </div>
        </div>
    );
}
