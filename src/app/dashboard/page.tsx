import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { gscProperties, memberships } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { DataSyncHistory } from "@/components/dashboard/sync-history";
import { VelocityHeatmap } from "@/components/dashboard/velocity-heatmap";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { Activity, ShieldCheck, Database, Zap } from "lucide-react";
import { getDashboardKPIs } from "@/lib/gsc/analytics";
import { SyncPulse } from "@/components/dashboard/sync-pulse";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    let session = await auth();

    if (!session?.user?.id) {
        redirect("/api/auth/signin");
    }

    let property = null;

    try {
        // 1. Get User's Orgs
        const userOrgs = await db.query.memberships.findMany({
            where: eq(memberships.userId, session.user.id),
            columns: { orgId: true }
        });

        const orgIds = userOrgs.map(m => m.orgId);

        if (orgIds.length > 0) {
            property = await db.query.gscProperties.findFirst({
                where: inArray(gscProperties.orgId, orgIds),
                orderBy: (props, { desc }) => [desc(props.lastSynced)],
            });
        }
    } catch (e) {
        console.error("DB Query failed in debug mode or otherwise", e);
    }

    if (!property) {
        redirect("/onboarding");
    }

    const kpiData = await getDashboardKPIs(property.id);

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto selection:bg-blue-500/30">
            {/* Mission Critical KPI Row */}
            <KPICards data={kpiData} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Intel Section: 8 cols */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <div className="flex-1">
                        <VelocityHeatmap propertyId={property.id} />
                    </div>

                    {/* System Status Alerts / Insights Feed */}
                    <div className="bg-zinc-950 border border-slate-800 rounded p-4">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
                            <div className="flex items-center gap-2">
                                <Activity className="w-3.5 h-3.5 text-blue-500" />
                                <h3 className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">ACTIVE_INSIGHTS_QUEUE</h3>
                            </div>
                            <span className="text-[9px] font-mono text-slate-600">QUEUE_DEPTH: 05</span>
                        </div>
                        <div className="space-y-2">
                            {[1, 2, 3].map((item) => (
                                <div key={item} className="flex items-center gap-4 py-2 px-3 bg-slate-900/40 border border-slate-800/50 rounded hover:border-slate-700 transition-colors group cursor-pointer">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500/50 group-hover:text-emerald-500 transition-colors" />
                                    <div className="flex-1">
                                        <p className="text-[11px] font-mono text-slate-300">CORE_VITAL_OPTIMIZATION: Priority URL [path/to/page] showing 15% LCP improvement possible.</p>
                                    </div>
                                    <span className="text-[9px] font-mono text-slate-600 uppercase tracking-tighter">SIG_HIGH</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Monitoring: 4 cols */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <DataSyncHistory propertyId={property.id} />
                    <SyncPulse propertyId={property.id} />

                    <div className="bg-slate-900/50 border border-slate-800/50 rounded p-4 text-center">
                        <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">
                            Heartbeat detected via 127.0.0.1:8080 <br />
                            Last signal: 0.04s ago
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
