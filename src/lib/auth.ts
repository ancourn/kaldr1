import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "./db"
import CredentialsProvider from "next-auth/providers/credentials"
import { UserRole } from "@prisma/client"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // For demo purposes, we'll create a simple authentication
        // In production, you should hash passwords and use proper authentication
        
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // For demo, accept any email/password combination
        // In production, verify against database with hashed passwords
        let user = await db.user.findUnique({
          where: { email: credentials.email }
        })

        // If user doesn't exist, create one for demo
        if (!user) {
          user = await db.user.create({
            data: {
              email: credentials.email,
              name: credentials.email.split('@')[0],
              role: UserRole.DEVELOPER
            }
          })
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as UserRole
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/signin"
  }
}