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
        <div className="mt-6 border border-zinc-800 rounded bg-zinc-900/50 p-4">
            <h3 className="text-sm font-mono text-zinc-400 mb-3">DATA_INGESTION_LOG</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                    <thead>
                        <tr className="text-left text-zinc-500 border-b border-zinc-800">
                            <th className="pb-2">STATUS</th>
                            <th className="pb-2">ROWS</th>
                            <th className="pb-2">DURATION</th>
                            <th className="pb-2">AGE</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {history.map((job) => {
                            const result = job.result as any;
                            const count = result?.rowsSynced || 0;
                            const duration = job.completedAt && job.startedAt
                                ? (job.completedAt.getTime() - job.startedAt.getTime()) / 1000
                                : 0;

                            return (
                                <tr key={job.id} className="text-zinc-300">
                                    <td className="py-2">
                                        <span className={`
                                            px-1.5 py-0.5 rounded-sm 
                                            ${job.status === 'COMPLETED' ? 'bg-emerald-900/30 text-emerald-500' :
                                                job.status === 'FAILED' ? 'bg-red-900/30 text-red-500' : 'text-zinc-400'}
                                        `}>
                                            {job.status}
                                        </span>
                                    </td>
                                    <td className="py-2">{count.toLocaleString()}</td>
                                    <td className="py-2">{duration.toFixed(1)}s</td>
                                    <td className="py-2 text-zinc-500">
                                        {formatDistanceToNow(job.createdAt!, { addSuffix: true })}
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
