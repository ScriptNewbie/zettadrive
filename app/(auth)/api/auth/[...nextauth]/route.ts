import { database } from "@/app/db/database";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import NextAuth from "next-auth";
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
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
