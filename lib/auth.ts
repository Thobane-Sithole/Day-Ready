import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db, ensureSchema } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = (credentials?.email as string)?.toLowerCase().trim();
        const password = credentials?.password as string;
        if (!email || !password) return null;

        await ensureSchema();
        const rows = await db.select().from(users).where(eq(users.email, email));
        const user = rows[0];
        if (!user) return null;

        // Accounts created via Google have no password set — they can only
        // sign in with Google, not with a password.
        if (!user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    signIn: async ({ user, account }) => {
      // Only the Google flow needs custom handling here — Credentials
      // already resolves to an existing row in `authorize` above.
      if (account?.provider !== "google") return true;

      const email = user.email?.toLowerCase().trim();
      if (!email) return false;

      await ensureSchema();
      const rows = await db.select().from(users).where(eq(users.email, email));
      const existing = rows[0];

      if (existing) {
        // Link: an account with this email already exists (created via
        // credentials or a prior Google sign-in) — reuse it.
        user.id = existing.id;
        return true;
      }

      // First time this Google account has been seen — create a row for it.
      // passwordHash stays null; this account can only sign in via Google.
      const [created] = await db
        .insert(users)
        .values({
          name: user.name || email.split("@")[0],
          email,
          passwordHash: null,
        })
        .returning();
      user.id = created.id;
      return true;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
});
