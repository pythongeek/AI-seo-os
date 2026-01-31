export default function Loading() {
    return (
        <main className="min-h-screen bg-black text-white p-6 md:p-12 font-mono">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12 border-b border-zinc-800 pb-6">
                    <div className="h-8 w-64 bg-zinc-900 animate-pulse mb-2 rounded" />
                    <div className="h-4 w-96 bg-zinc-900 animate-pulse rounded" />
                </header>

                <div className="w-full max-w-5xl">
                    <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                        <div className="h-6 w-48 bg-zinc-900 animate-pulse rounded" />
                        <div className="h-8 w-24 bg-zinc-800 animate-pulse rounded" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="border border-zinc-800 bg-zinc-900/30 p-4 h-32 animate-pulse rounded" />
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
