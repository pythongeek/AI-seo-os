import Google from 'next-auth/providers/google';
import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-compatible Auth Configuration
 * Contains only providers and logic safe for Edge Runtime (Middleware).
 * No Database Adapters or Node.js-only modules allowed here.
 */
export const authConfig = {
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            authorization: {
                params: {
                    access_type: 'offline',
                    prompt: 'consent',
                    scope: 'openid email profile https://www.googleapis.com/auth/webmasters.readonly',
                },
            },
        }),
    ],
    pages: {
        signIn: '/api/auth/signin',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            const isOnApi = nextUrl.pathname.startsWith('/api/agent') || nextUrl.pathname.startsWith('/api/gsc');

            // Logic from original middleware
            if ((isOnDashboard || isOnApi) && !isLoggedIn) {
                return false; // Redirects to signin
            }
            return true;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;
