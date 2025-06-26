import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { db } from "~/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      mcUsername: string;
      mcUUID: string | null;
    };
  }

  interface User {
    id?: string;
    mcUsername?: string;
    mcUUID?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

// JWT module augmentation is handled differently in NextAuth v5
// The token properties are automatically typed through the callbacks

const loginSchema = z.object({
  mcUsername: z.string().min(1, "Minecraft username is required"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  trustHost: true,
  // Set the base URL for proper redirects in Docker and production
  basePath: "/api/auth",
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        mcUsername: {
          label: "Minecraft Username",
          type: "text",
          placeholder: "Enter your Minecraft username",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter your password",
        },
      },
      async authorize(credentials) {
        try {
          const { mcUsername, password } = loginSchema.parse(credentials);

          const user = await db.user.findUnique({
            where: { mcUsername },
            select: {
              id: true,
              mcUsername: true,
              mcUUID: true,
              password: true,
              name: true,
              email: true,
              image: true,
            },
          });

          if (!user) {
            console.log("User not found:", mcUsername);
            return null;
          }

          const isPasswordValid = await bcrypt.compare(password, user.password);
          if (!isPasswordValid) {
            console.log("Invalid password for user:", mcUsername);
            return null;
          }

          return {
            id: user.id,
            mcUsername: user.mcUsername,
            mcUUID: user.mcUUID,
            name: user.name,
            email: user.email,
            image: user.image,
          };
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.mcUsername = user.mcUsername;
        token.mcUUID = user.mcUUID;
      }
      return token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: (token.id as string) ?? "",
        mcUsername: (token.mcUsername as string) ?? "",
        mcUUID: (token.mcUUID as string | null) ?? null,
      },
    }),
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
} satisfies NextAuthConfig;
