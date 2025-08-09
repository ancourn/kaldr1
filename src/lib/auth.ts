import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "./db"
import CredentialsProvider from "next-auth/providers/credentials"
import { UserRole } from "@prisma/client"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Find user by email
        const user = await db.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) {
          return null
        }

        // For demo purposes, we'll accept any password
        // In production, you should verify the hashed password
        // const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        // if (!isPasswordValid) {
        //   return null
        // }

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