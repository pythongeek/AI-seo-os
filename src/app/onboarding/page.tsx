import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { gscProperties } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import PropertyGrid from "./property-grid";

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/api/auth/signin");
    }

    const properties = await db.query.gscProperties.findMany({
        where: eq(gscProperties.userId, session.user.id),
        orderBy: (props, { desc }) => [desc(props.lastSynced)],
    });

    return (
        <main className="min-h-screen bg-black text-white p-6 md:p-12 font-mono">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12 border-b border-zinc-800 pb-6">
                    <h1 className="text-3xl font-bold mb-2 tracking-tighter">
                        <span className="text-emerald-500">AI_SEO_OS</span> // ONBOARDING
                    </h1>
                    <div className="flex justify-between items-end">
                        <p className="text-zinc-500 text-sm max-w-lg">
                            SELECT TARGET PROPERTY FOR OPTIMIZATION. SYSTEM WILL INITIALIZE DATA PIPELINE.
                        </p>
                        <div className="text-right text-xs text-zinc-600">
                            SESSION: {session.user.email} <br />
                            STATUS: AUTHENTICATED
                        </div>
                    </div>
                </header>

                <PropertyGrid properties={properties} />
            </div>
        </main>
    );
}
