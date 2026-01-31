import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const isOnDashboard = req.nextUrl.pathname.startsWith('/dashboard');
    const isOnApi = req.nextUrl.pathname.startsWith('/api/agent') || req.nextUrl.pathname.startsWith('/api/gsc');

    if ((isOnDashboard || isOnApi) && !isLoggedIn) {
        return NextResponse.redirect(new URL('/api/auth/signin', req.nextUrl));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
