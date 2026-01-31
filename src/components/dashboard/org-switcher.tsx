'use client';

import { useState } from 'react';
import { ChevronDown, Building2, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Organization {
    id: string;
    name: string;
    slug: string;
    role: string;
}

export function OrgSwitcher({ organizations, activeOrgId, onSwitch }: {
    organizations: Organization[],
    activeOrgId: string,
    onSwitch: (id: string) => void
}) {
    const [isOpen, setIsOpen] = useState(false);
    const activeOrg = organizations.find(org => org.id === activeOrgId) || organizations[0];

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-slate-800 transition-colors text-sm font-medium text-slate-200"
            >
                <div className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <span className="truncate max-w-[120px]">{activeOrg?.name}</span>
                <ChevronDown className={cn("w-4 h-4 text-slate-500 transition-transform", isOpen ? "rotate-180" : "")} />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Organizations
                        </div>
                        <div className="mt-1 max-h-[200px] overflow-y-auto">
                            {organizations.map((org) => (
                                <button
                                    key={org.id}
                                    onClick={() => {
                                        onSwitch(org.id);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                                        org.id === activeOrgId
                                            ? "bg-blue-600/10 text-blue-400"
                                            : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                                    )}
                                >
                                    <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        org.id === activeOrgId ? "bg-blue-500" : "bg-transparent"
                                    )} />
                                    <span className="flex-1 text-left truncate">{org.name}</span>
                                    {org.id === activeOrgId && <Check className="w-3.5 h-3.5" />}
                                </button>
                            ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-800">
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
                                <Plus className="w-3.5 h-3.5" />
                                <span>Create Organization</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
