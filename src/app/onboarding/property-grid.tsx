'use client';

import { useMutation } from '@tanstack/react-query';
import { initializeProperty, syncProperties } from '@/app/actions/gsc';
import { useRouter } from 'next/navigation';

interface Property {
    id: string;
    propertyUrl: string;
    permissionLevel: string | null;
    syncStatus: string | null;
}

export default function PropertyGrid({ properties }: { properties: Property[] }) {
    const [isPending] = [false];
    const router = useRouter();

    const { mutate: sync, isPending: isSyncing } = useMutation({
        mutationFn: async () => {
            const result = await syncProperties();
            if (!result.success) throw new Error(result.error);
            return result;
        },
        onSuccess: () => {
            router.refresh();
        }
    });

    const { mutate: init, isPending: isInitializing } = useMutation({
        mutationFn: async (id: string) => {
            const result = await initializeProperty(id);
            if (!result.success) throw new Error(result.error);
            return result;
        },
        onSuccess: () => {
            router.push('/dashboard');
        }
    });

    return (
        <div className="w-full max-w-5xl">
            <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                <h2 className="text-xl font-mono text-zinc-400">AVAILABLE_PROPERTIES</h2>
                <button
                    onClick={() => sync()}
                    disabled={isSyncing}
                    className="font-mono text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 border border-zinc-600 rounded disabled:opacity-50"
                >
                    {isSyncing ? 'SYNCING...' : 'REFRESH_LIST'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.map((prop) => (
                    <div
                        key={prop.id}
                        className={`
                            border p-4 font-mono text-sm relative group transition-colors
                            ${prop.syncStatus === 'active'
                                ? 'border-emerald-500/50 bg-emerald-900/10'
                                : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600'}
                        `}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-zinc-500 text-xs">ID: {prop.id.slice(0, 8)}</span>
                            <span className={`text-xs px-2 py-0.5 border ${prop.permissionLevel === 'siteOwner' ? 'border-emerald-800 text-emerald-500' : 'border-amber-800 text-amber-500'}`}>
                                {prop.permissionLevel === 'siteOwner' ? 'OWNER' : 'USER'}
                            </span>
                        </div>

                        <div className="mb-6 truncate text-zinc-200 font-bold" title={prop.propertyUrl}>
                            {prop.propertyUrl}
                        </div>

                        <div className="flex justify-between items-center mt-auto">
                            <div className="text-xs text-zinc-600">
                                STAT: {prop.syncStatus?.toUpperCase()}
                            </div>
                            <button
                                onClick={() => init(prop.id)}
                                disabled={isInitializing || prop.syncStatus === 'active'}
                                className={`
                                    text-xs px-3 py-1.5 border transition-all
                                    ${prop.syncStatus === 'active'
                                        ? 'border-emerald-500 text-emerald-500 cursor-default'
                                        : 'border-zinc-600 text-zinc-400 hover:bg-zinc-800 hover:text-white'}
                                `}
                            >
                                {prop.syncStatus === 'active' ? 'ACTIVE' : 'INITIALIZE >'}
                            </button>
                        </div>
                    </div>
                ))}

                {properties.length === 0 && (
                    <div className="col-span-full text-center py-12 border border-zinc-800 border-dashed text-zinc-500">
                        NO PROPERTIES FOUND. SYNC TO RETRIEVE.
                    </div>
                )}
            </div>
        </div>
    );
}
