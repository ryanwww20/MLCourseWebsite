import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";

const isLocalhost =
  process.env.NEXTAUTH_URL?.includes("localhost") ??
  process.env.NODE_ENV === "development";

export const authOptions: NextAuthOptions = {
  providers: [
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
    session({ session, token }) {
      if (session.user) {
        session.user.image = token.picture ?? session.user.image;
      }
      return session;
    },
  },
};
