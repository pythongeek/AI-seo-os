import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from '@/components/dashboard/sidebar-premium';
import { DashboardHeader } from '@/components/dashboard/header-premium';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // For production we would  // const session = await auth();
    const session = await auth();

    if (!session?.user) {
        redirect('/api/auth/signin');
    }

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            <DashboardSidebar user={session?.user} />
            <div className="flex-1 flex flex-col relative overflow-hidden">
                <DashboardHeader user={session?.user} />
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-0">
                    <div className="max-w-[1400px] mx-auto min-h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
