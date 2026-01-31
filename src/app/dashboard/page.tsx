import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { gscProperties } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { DataSyncHistory } from "@/components/dashboard/sync-history";
import { VelocityHeatmap } from "@/components/dashboard/velocity-heatmap";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    let session = await auth();

    if (!session?.user?.id) {
        redirect("/api/auth/signin");
    }

    // Get the first active property for this MVP view
    // In a real app, we'd have a property switcher in the layout or context
    let property = null;

    try {
        property = await db.query.gscProperties.findFirst({
            where: eq(gscProperties.userId, session!.user!.id!),
            orderBy: (props, { desc }) => [desc(props.lastSynced)],
        });
    } catch (e) {
        console.error("DB Query failed in debug mode or otherwise", e);
    }

    if (!property) {
        redirect("/onboarding");
    }

    return (
        <div className="p-8 space-y-8">
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Overview</h2>
                    <div className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider">Live</div>
                </div>
                <p className="text-sm text-slate-500">
                    Real-time monitoring for <span className="text-slate-900 font-semibold">{property.propertyUrl}</span>
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                        <VelocityHeatmap propertyId={property.id} />
                    </div>
                </div>

                {/* Sidebar / Metadata */}
                <div className="space-y-8">
                    <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                        <DataSyncHistory propertyId={property.id} />
                    </div>

                    {/* Manual Trigger Button */}
                    <div className="p-6 bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-3xl border border-slate-800 shadow-xl shadow-slate-200/50">
                        <h3 className="text-xs font-bold text-slate-400 mb-4 tracking-widest uppercase">System Control</h3>
                        <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-blue-500/30 active:scale-95">
                            Force Sync Pulse
                        </button>
                        <p className="text-[10px] text-slate-500 mt-4 text-center">
                            Last heartbeat detected 4m ago.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
