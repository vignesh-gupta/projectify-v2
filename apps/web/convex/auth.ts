import GitHub from "@auth/core/providers/github"
import { Password } from "@convex-dev/auth/providers/Password"
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server"
import { query } from "./_generated/server"

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    GitHub,
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
      console.log({
        redirectTo,
      })

      return redirectTo ?? "/dashboard"
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
