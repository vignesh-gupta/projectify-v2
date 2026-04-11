import GitHub from "@auth/core/providers/github"
import { Password } from "@convex-dev/auth/providers/Password"
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server"
import { query } from "./_generated/server"

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    GitHub({
      issuer: "https://github.com/login/oauth",
    }),
    Password({
      profile(params) {
        const email = normalizeEmail(String(params.email ?? ""))
        const rawName = String(params.name ?? "").trim()
        const fallbackName = email.split("@")[0] || "User"

        if (!email) {
          throw new Error("Email is required")
        }

        return {
          email,
          name: rawName || fallbackName,
        }
      },
      validatePasswordRequirements(password) {
        if (password.trim().length < 8) {
          throw new Error("Password must be at least 8 characters long")
        }
      },
    }),
  ],
  session: {
    totalDurationMs: 1000 * 60 * 60 * 24, // 24 hours
  },
  callbacks: {
    redirect: async ({ redirectTo }) => {
      const siteUrl = process.env.SITE_URL

      if (!redirectTo) {
        return siteUrl ? `${siteUrl}/dashboard` : "/dashboard"
      }

      if (redirectTo.startsWith("/")) {
        return siteUrl ? `${siteUrl}${redirectTo}` : redirectTo
      }

      return redirectTo
    },
  },
  theme: {
    colorScheme: "dark",
  },
})

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      return null
    }
    return await ctx.db.get(userId)
  },
})
