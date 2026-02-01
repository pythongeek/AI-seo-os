import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { memberships, organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { DashboardSidebar } from '@/components/dashboard/sidebar-premium';
import { DashboardHeader } from '@/components/dashboard/header-premium';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/api/auth/signin');
    }

    // Fetch user organizations
    const userOrgs = await db.query.memberships.findMany({
        where: eq(memberships.userId, session.user.id),
        with: {
            organization: true
        }
    });

    const orgs = userOrgs.map(m => ({
        ...m.organization,
        role: m.role
    }));

    return (
        <div className="flex h-screen bg-zinc-950 text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30">
            <DashboardSidebar organizations={orgs} user={session.user} />
            <div className="flex-1 flex flex-col relative overflow-hidden">
                <DashboardHeader user={session.user} organizations={orgs} />
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-0 custom-scrollbar">
                    <div className="max-w-[1600px] mx-auto min-h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
