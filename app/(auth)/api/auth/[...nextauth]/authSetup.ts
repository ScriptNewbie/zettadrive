import { database } from "@/app/db/database";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { Session, User } from "next-auth";
import AuthentikProvider from "next-auth/providers/authentik";

export const authOptions = {
  providers: [
    AuthentikProvider({
      clientId: process.env.AUTHENTIK_ID!,
      clientSecret: process.env.AUTHENTIK_SECRET!,
      issuer: process.env.AUTHENTIK_ISSUER,
    }),
  ],
  adapter: PrismaAdapter(database),
  callbacks: {
    async session({ session, user }: { session: Session; user: User }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
};
