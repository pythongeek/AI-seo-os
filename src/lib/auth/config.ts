import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/security/encryption';
import { accounts, users, sessions, verificationTokens } from '@/db/schema';
import { authConfig } from './auth.config';

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    adapter: DrizzleAdapter(db, {
        accountsTable: accounts as any,
        usersTable: users as any,
        sessionsTable: sessions as any,
        verificationTokensTable: verificationTokens as any,
    }),
    callbacks: {
        ...authConfig.callbacks,
        async signIn({ account }) {
            // Node-only logic (Encryption)
            if (account?.refresh_token) {
                try {
                    // Temporarily cast to any to allow modification before save
                    (account as any).refresh_token = encrypt(account.refresh_token);
                } catch (e) {
                    console.error("Encryption failed", e);
                }
            }
            return true;
        },
        async session({ session, user }) {
            return session;
        }
    },
});

