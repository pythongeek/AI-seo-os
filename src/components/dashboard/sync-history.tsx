import { db } from "@/lib/db";
import { backgroundJobs, gscProperties } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { formatDistanceToNow } from "date-fns";

export async function DataSyncHistory({ propertyId }: { propertyId: string }) {
    const history = await db.query.backgroundJobs.findMany({
        where: and(
            eq(backgroundJobs.propertyId, propertyId),
            eq(backgroundJobs.jobType, 'manual_sync') // or daily_sync, show all? prompt says 'Data Sync History'
        ),
        orderBy: [desc(backgroundJobs.createdAt)],
        limit: 5
    });

    if (!history.length) return <div className="text-zinc-500 text-xs mt-4">NO SYNC HISTORY</div>;

    return (
        <div className="bg-zinc-900/30 border border-slate-800/50 rounded overflow-hidden">
            <div className="bg-slate-900/50 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest">INGEST_LOG</h3>
                <span className="text-[9px] font-mono text-blue-500/50">SQL_SESSIONS: 4</span>
            </div>
            <div className="p-0 overflow-x-auto">
                <table className="w-full text-[10px] font-mono border-collapse">
                    <thead>
                        <tr className="text-left text-slate-600 border-b border-slate-800/50 bg-slate-900/20">
                            <th className="px-3 py-2 font-bold uppercase tracking-tighter">STAT</th>
                            <th className="px-3 py-2 font-bold uppercase tracking-tighter">VOL</th>
                            <th className="px-3 py-2 font-bold uppercase tracking-tighter">DUR</th>
                            <th className="px-3 py-2 font-bold uppercase tracking-tighter text-right">TIMESTAMP</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                        {history.map((job) => {
                            const result = job.result as any;
                            const count = result?.rowsSynced || 0;
                            const duration = job.completedAt && job.startedAt
                                ? (job.completedAt.getTime() - job.startedAt.getTime()) / 1000
                                : 0;

                            return (
                                <tr key={job.id} className="text-slate-400 hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "w-1 h-1 rounded-full",
                                                job.status === 'COMPLETED' ? "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.3)]" :
                                                    job.status === 'FAILED' ? "bg-rose-500" : "bg-blue-500"
                                            )} />
                                            <span className={cn(
                                                "font-bold",
                                                job.status === 'COMPLETED' ? "text-emerald-500" :
                                                    job.status === 'FAILED' ? "text-rose-500" : "text-blue-500"
                                            )}>{job.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 tabular-data">{count.toLocaleString().padStart(6, '0')}</td>
                                    <td className="px-3 py-2 tabular-data">{duration.toFixed(2)}s</td>
                                    <td className="px-3 py-2 text-right text-slate-600 tabular-data">
                                        {formatDistanceToNow(job.createdAt!, { addSuffix: false }).toUpperCase()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
