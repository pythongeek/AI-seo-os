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
    { href: '/dashboard/chat', label: 'AI Swarm Chat', icon: MessageSquare },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/dashboard/skills', label: 'Skill Library', icon: BookOpen },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function DashboardSidebar({ user }: { user: any }) {
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
                "h-screen bg-[#0f172a] border-r border-slate-800 transition-all duration-300 flex flex-col relative",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            {/* Brand Section */}
            <div className="p-6 flex items-center gap-3 border-b border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Activity className="text-white w-6 h-6" />
                </div>
                {!isCollapsed && (
                    <div className="flex flex-col">
                        <span className="text-white font-bold tracking-tight text-lg">AI SEO OS</span>
                        <span className="text-xs text-slate-400 font-medium tracking-wider uppercase">Enterprise</span>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 mt-4">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden',
                                isActive
                                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.1)]'
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                            )}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full" />
                            )}
                            <Icon className={cn(
                                "w-5 h-5 shrink-0 transition-transform group-hover:scale-110",
                                isActive ? "text-blue-500" : "text-slate-500 group-hover:text-slate-300"
                            )} />
                            {!isCollapsed && (
                                <div className="flex-1 flex items-center justify-between">
                                    <span>{item.label}</span>
                                    {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
                                </div>
                            )}

                            {/* Tooltip for collapsed mode */}
                            {isCollapsed && (
                                <div className="absolute left-16 bg-slate-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 text-xs shadow-xl border border-slate-700">
                                    {item.label}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Swarm Status Indicator */}
            {!isCollapsed && (
                <div className="m-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <div className={cn(
                            "w-2 h-2 rounded-full animate-pulse",
                            swarmHealth === 'healthy' ? "bg-green-500" :
                                swarmHealth === 'unhealthy' ? "bg-red-500" : "bg-slate-500"
                        )} />
                        <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest">Swarm Status</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                        {swarmHealth === 'healthy' ? 'All systems operational.' :
                            swarmHealth === 'unhealthy' ? 'System disruption detected.' : 'Syncing swarm status...'} <br />
                        Institutional memory synchronized.
                    </p>
                    <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-1"><Database className="w-3 h-3" /> 1.2 GB</span>
                        <span>v2.1.0</span>
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
