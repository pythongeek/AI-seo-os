import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { gscProperties, urlMetrics } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import UrlTable from "@/components/urls/url-table";

export const dynamic = 'force-dynamic';

export default async function UrlsPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/api/auth/signin");
    }

    // Default to first property
    const property = await db.query.gscProperties.findFirst({
        where: eq(gscProperties.userId, session.user.id),
        orderBy: (props, { desc }) => [desc(props.lastSynced)],
    });

    if (!property) redirect("/onboarding");

    // Fetch all Score URLs
    const urls = await db.query.urlMetrics.findMany({
        where: eq(urlMetrics.propertyId, property.id),
        orderBy: [desc(urlMetrics.seoPriorityScore)],
        limit: 1000 // Limit for initial render safety, virtualizer can handle more but fetch payload needs management in real app
    });

    return (
        <main className="min-h-screen bg-black text-white p-6 md:p-12 font-mono">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 border-b border-zinc-800 pb-6">
                    <h1 className="text-3xl font-bold mb-2 tracking-tighter">
                        <span className="text-emerald-500">AI_SEO_OS</span> // URL_INTELLIGENCE
                    </h1>
                    <div className="text-zinc-500 text-sm">
                        TARGET: <span className="text-white">{property.propertyUrl}</span>
                    </div>
                </header>

                <UrlTable urls={urls} />
            </div>
        </main>
    );
}
