import GitHub from "@auth/core/providers/github"
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server"
import { query } from "./_generated/server"

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [GitHub],
  session: {
    totalDurationMs: 1000 * 60 * 60 * 24, // 24 hours
  },
  callbacks: {
    redirect: async ({ redirectTo }) => {
      if (redirectTo) {
        return redirectTo
      }
      return "/dashboard"
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
