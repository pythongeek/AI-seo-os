'use client';

import { useState } from "react";
import { Zap, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function SyncPulse({ propertyId }: { propertyId: string }) {
    const [isSyncing, setIsSyncing] = useState(false);
    const router = useRouter();

    const triggerSync = async () => {
        setIsSyncing(true);
        try {
            const res = await fetch('/api/gsc/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ propertyId })
            });

            if (res.ok) {
                // Wait a bit then refresh to see the job in history
                setTimeout(() => {
                    router.refresh();
                    setIsSyncing(false);
                }, 2000);
            } else {
                setIsSyncing(false);
            }
        } catch (e) {
            console.error("Sync trigger failed", e);
            setIsSyncing(false);
        }
    };

    return (
        <div className="bg-zinc-950 border border-slate-800 rounded p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap className="w-16 h-16 text-blue-500" />
            </div>

            <h3 className="text-[10px] font-bold font-mono text-slate-500 mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                KERNEL_CONTROLS
            </h3>

            <div className="space-y-3">
                <button
                    onClick={triggerSync}
                    disabled={isSyncing}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-mono font-bold text-[10px] uppercase tracking-widest transition-all shadow-[0_4px_1px_rgba(37,99,235,0.2)] active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-2"
                >
                    {isSyncing ? (
                        <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            EXECUTING_SYNC...
                        </>
                    ) : (
                        "EXEC_FULL_RESCAN"
                    )}
                </button>
                <button className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-mono font-bold text-[10px] uppercase tracking-widest transition-all">
                    REBUILD_INST_MEMORY
                </button>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800">
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-600 uppercase mb-2">
                    <span>SWARM_LOAD</span>
                    <span>{isSyncing ? "SYNCHRONIZING [88%]" : "NORMAL [24%]"}</span>
                </div>
                <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                    <div className={isSyncing ? "h-full w-full bg-blue-500 animate-pulse" : "h-full w-1/4 bg-blue-500"} />
                </div>
            </div>
        </div>
    );
}
