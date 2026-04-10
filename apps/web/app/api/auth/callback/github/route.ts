import { NextResponse } from "next/server"

export async function GET(request: Request) {
  console.log("Received GitHub callback with URL:", request.url)
  return NextResponse.redirect(
    "https://brave-bullfrog-153.eu-west-1.convex.site/api/auth/callback/github",
    {
      status: 302,
    }
  )
}
