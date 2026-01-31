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

// Mock data for UI demonstration
const MOCK_ORGS = [
    { id: 'org-1', name: 'Global SEO Agency', slug: 'global-seo', role: 'OWNER' },
    { id: 'org-2', name: 'Alpha Tech Corp', slug: 'alpha-tech', role: 'ADMIN' },
];

export function DashboardHeader({ user }: { user: any }) {
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    return (
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40">
            {/* Left Search Bar */}
            <div className="flex items-center gap-4 flex-1 max-w-xl">
                <div className="relative w-full group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search analytics, agents, or institutional memory..."
                        className="w-full h-10 pl-10 pr-4 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 rounded-2xl text-sm transition-all outline-none"
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-[10px] text-slate-400 font-mono">
                            <Command className="w-2.5 h-2.5" />
                            <span>K</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Center: Org Switcher */}
            <div className="flex-1 flex justify-center">
                <OrgSwitcher
                    organizations={MOCK_ORGS}
                    activeOrgId="org-1"
                    onSwitch={(id) => console.log('Switch to', id)}
                />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
                {/* Active Property Selector */}
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer mr-2">
                    <Globe className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs font-semibold text-slate-700">seo-os.com</span>
                    <Settings2 className="w-3.5 h-3.5 text-slate-400" />
                </div>

                <button
                    aria-label="View notifications"
                    className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors relative"
                >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full" />
                </button>

                <button
                    aria-label="Get help"
                    className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
                >
                    <HelpCircle className="w-5 h-5" />
                </button>

                <div className="h-6 w-[1px] bg-slate-200 mx-2" />

                <div className="flex items-center gap-3 pl-2">
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-slate-900 leading-none">System Operator</span>
                        <span className="text-[10px] font-medium text-green-600 leading-none mt-1 uppercase tracking-wider">Level 4 Certified</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 border border-slate-200" />
                </div>
            </div>
        </header>
    );
}
