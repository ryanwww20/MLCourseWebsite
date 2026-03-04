import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";

const isLocalhost =
  process.env.NEXTAUTH_URL?.includes("localhost") ??
  process.env.NODE_ENV === "development";

const ADMIN_USER = "admin";
const ADMIN_PASS = "admin";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "帳號密碼",
      credentials: {
        username: { label: "帳號", type: "text" },
        password: { label: "密碼", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        if (credentials.username === ADMIN_USER && credentials.password === ADMIN_PASS) {
          return { id: "admin", name: ADMIN_USER, email: "admin@local", role: "admin" } as { id: string; name: string; email: string; role: string };
        }
        return null;
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  // Avoid secure cookies on http://localhost to prevent redirect/session issues
  useSecureCookies: !isLocalhost,
  callbacks: {
    redirect({ url, baseUrl }) {
      const origin = new URL(baseUrl).origin;
      const SITE = `${origin}/course`;
      const fallback = `${SITE}/home`;

      if (url.startsWith("/")) {
        const abs = url.startsWith("/course") ? `${origin}${url}` : `${SITE}${url}`;
        return abs;
      }

      try {
        const parsed = new URL(url);
        if (parsed.origin !== origin) return fallback;
        if (!parsed.pathname.startsWith("/course")) return fallback;
        return url;
      } catch {
        return fallback;
      }
    },
    jwt({ token, user }) {
      if (user?.role) token.role = user.role;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.image = token.picture ?? session.user.image;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/course/auth/signin",
  },
};
