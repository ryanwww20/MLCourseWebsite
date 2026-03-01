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
      const want = url.startsWith("/") ? `${baseUrl.replace(/\/$/, "")}${url}` : url;
      try {
        const wantOrigin = new URL(want).origin;
        const baseOrigin = new URL(baseUrl).origin;
        if (wantOrigin !== baseOrigin) return baseUrl;
        return want;
      } catch {
        return baseUrl;
      }
    },
    jwt({ token, user }) {
      if (user && "role" in user) token.role = (user as { role?: string }).role;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.image = token.picture ?? session.user.image;
        (session.user as { role?: string }).role = token.role as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};
