import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server"

const isSignInPage = createRouteMatcher(["/login", "/register"])
const isProtectedRoute = createRouteMatcher([
  "/product(.*)",
  "/dashboard(.*)",
  "/project(.*)",
])

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const isAuthenticated = await convexAuth.isAuthenticated()

  if (isSignInPage(request) && isAuthenticated) {
    return nextjsMiddlewareRedirect(
      request,
      request.nextUrl.searchParams.get("from") || "/dashboard"
    )
  }
  if (isProtectedRoute(request) && !isAuthenticated) {
    return nextjsMiddlewareRedirect(request, "/login")
  }
})

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}
