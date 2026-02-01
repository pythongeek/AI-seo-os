'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    MessageSquare,
    BarChart3,
    BookOpen,
    Settings,
    Activity,
    ChevronRight,
    Database
} from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/chat', label: 'AI Swarm', icon: MessageSquare },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/urls', label: 'URL Priority', icon: Database },
    { href: '/dashboard/skills', label: 'Skill Lib', icon: BookOpen },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function DashboardSidebar({ user, organizations }: { user: any; organizations: any[] }) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [swarmHealth, setSwarmHealth] = useState<'healthy' | 'unhealthy' | 'loading'>('loading');

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const res = await fetch('/api/health');
                const data = await res.json();
                setSwarmHealth(data.status === 'ok' ? 'healthy' : 'unhealthy');
            } catch (error) {
                setSwarmHealth('unhealthy');
            }
        };

        checkHealth();
        const interval = setInterval(checkHealth, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    return (
        <aside
            className={cn(
                "h-screen bg-zinc-950 border-r border-slate-800 transition-all duration-300 flex flex-col relative",
                isCollapsed ? "w-16" : "w-60"
            )}
        >
            {/* Brand Section */}
            <div className="p-4 flex items-center gap-3 border-b border-slate-800 h-16">
                <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                    <Activity className="text-white w-5 h-5" />
                </div>
                {!isCollapsed && (
                    <div className="flex flex-col">
                        <span className="text-slate-100 font-bold tracking-tighter text-base font-mono">SEO OS [V2.5]</span>
                        <span className="text-[10px] text-blue-500 font-bold tracking-widest uppercase terminal-density">Kernel Active</span>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-2 space-y-1 mt-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'group flex items-center gap-3 px-3 py-2 rounded transition-all duration-150 relative overflow-hidden',
                                isActive
                                    ? 'bg-blue-600/5 text-blue-400 border border-blue-500/10'
                                    : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'
                            )}
                        >
                            <Icon className={cn(
                                "w-4 h-4 shrink-0 transition-transform",
                                isActive ? "text-blue-500" : "text-slate-600 group-hover:text-slate-400"
                            )} />
                            {!isCollapsed && (
                                <div className="flex-1 flex items-center justify-between">
                                    <span className="text-xs font-medium font-mono uppercase tracking-tight">{item.label}</span>
                                    {isActive && <ChevronRight className="w-3 h-3 opacity-50" />}
                                </div>
                            )}

                            {isCollapsed && (
                                <div className="absolute left-14 bg-zinc-900 text-[10px] text-slate-200 px-2 py-1 rounded-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity font-mono uppercase tracking-widest border border-slate-800 z-50">
                                    {item.label}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Swarm Heartbeat Indicator */}
            {!isCollapsed && (
                <div className="mx-2 mb-4 p-3 rounded bg-slate-900/30 border border-slate-800/50">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Swarm Pulse</span>
                        <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            swarmHealth === 'healthy' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500"
                        )} />
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                        {['MN', 'AI', 'GS', 'MM'].map((node) => (
                            <div key={node} className="flex flex-col items-center gap-1">
                                <div className={cn(
                                    "w-full h-1 rounded-full overflow-hidden bg-slate-800",
                                    swarmHealth === 'healthy' ? "after:bg-emerald-500" : "after:bg-rose-500"
                                )}>
                                    <div className={cn(
                                        "h-full w-full bg-emerald-500/20",
                                        swarmHealth === 'healthy' && "animate-pulse"
                                    )} />
                                </div>
                                <span className="text-[8px] font-mono font-bold text-slate-600">{node}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-3 flex items-center justify-between px-1 border-t border-slate-800 pt-3">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-mono text-slate-400 leading-none">MEM_USAGE</span>
                            <span className="text-[10px] font-mono text-emerald-500 font-bold tabular-nums">1.2GB/4GB</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-mono text-slate-400 leading-none">LATENCY</span>
                            <span className="text-[10px] font-mono text-blue-400 font-bold tabular-nums">42ms</span>
                        </div>
                    </div>
                </div>
            )}

            {/* User Session Footer */}
            <div className="p-4 border-t border-slate-800 bg-[#0c1222]">
                <div className={cn(
                    "flex items-center gap-3 overflow-hidden",
                    isCollapsed ? "justify-center" : ""
                )}>
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex-shrink-0 border border-slate-700 flex items-center justify-center">
                        {user?.image ? (
                            <img src={user.image} alt="Avatar" className="w-full h-full rounded-full" />
                        ) : (
                            <span className="text-xs text-slate-400">{user?.name?.charAt(0) || user?.email?.charAt(0)}</span>
                        )}
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Operator'}</span>
                            <span className="text-[10px] text-slate-500 truncate">{user?.email}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Collapse Toggle */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="absolute -right-3 top-20 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors shadow-lg z-50"
            >
                <ChevronRight className={cn("w-4 h-4 transition-transform", isCollapsed ? "" : "rotate-180")} />
            </button>
        </aside>
    );
}
