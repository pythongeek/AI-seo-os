'use client';

import {
    Bell,
    Search,
    Command,
    HelpCircle,
    Globe,
    Settings2
} from 'lucide-react';
import { useState } from 'react';
import { OrgSwitcher } from './org-switcher';

export function DashboardHeader({ user, organizations }: { user: any; organizations: any[] }) {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const activeOrg = organizations[0]; // Simple logic for MVP

    return (
        <header className="h-16 border-b border-slate-800 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40">
            {/* Left: Search & Ticker */}
            <div className="flex items-center gap-6 flex-1 max-w-2xl">
                <div className="relative w-full group max-w-md">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Search className="w-3.5 h-3.5 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="EXECUTE SEARCH_CMD..."
                        className="w-full h-9 pl-9 pr-4 bg-slate-900/50 border border-slate-800 focus:bg-zinc-900 focus:border-blue-500/50 rounded text-[11px] font-mono transition-all outline-none text-slate-300 placeholder:text-slate-700 uppercase tracking-widest"
                    />
                </div>

                <div className="hidden xl:flex items-center gap-4 text-[10px] font-mono text-slate-600 border-l border-slate-800 pl-6 uppercase tracking-widest overflow-hidden whitespace-nowrap">
                    <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> GSC_STREAM: ACTIVE</span>
                    <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-blue-500" /> KERNEL_LOAD: 0.12%</span>
                </div>
            </div>

            {/* Center: Context Selection */}
            <div className="flex items-center gap-2">
                <OrgSwitcher
                    organizations={organizations}
                    activeOrgId={activeOrg?.id}
                    onSwitch={(id) => console.log('Switch to', id)}
                />
                <div className="h-4 w-[1px] bg-slate-800 mx-1" />
                <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer">
                    <Globe className="w-3 h-3 text-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-300 font-mono tracking-tighter uppercase whitespace-nowrap">seo-os.com</span>
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
                <button
                    aria-label="View notifications"
                    className="p-2 rounded hover:bg-slate-900 transition-colors relative"
                >
                    <Bell className="w-4 h-4 text-slate-500" />
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                </button>

                <button
                    aria-label="Get help"
                    className="p-2 rounded hover:bg-slate-900 transition-colors"
                >
                    <HelpCircle className="w-4 h-4 text-slate-500" />
                </button>

                <div className="h-8 w-[1px] bg-slate-800 mx-2" />

                <div className="flex items-center gap-3 pl-2">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-slate-200 leading-none font-mono uppercase tracking-widest">Operator.sys</span>
                        <span className="text-[8px] font-bold text-emerald-500 leading-none mt-1 uppercase tracking-[0.2em]">L4_AUTH_OS</span>
                    </div>
                    <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-blue-500 text-xs shadow-inner">
                        OP
                    </div>
                </div>
            </div>
        </header>
    );
}
