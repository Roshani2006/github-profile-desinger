import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
      authorization: { params: { scope: "read:user repo" } },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.access_token) token.githubAccessToken = account.access_token;
      if (profile && "login" in profile && typeof profile.login === "string") token.githubLogin = profile.login;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.githubLogin) {
        session.user.name = session.user.name || String(token.githubLogin);
        session.user.githubLogin = String(token.githubLogin);
      }
      return session;
    },
  },
};