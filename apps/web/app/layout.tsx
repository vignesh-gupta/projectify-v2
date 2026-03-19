import { Geist_Mono, Noto_Sans } from "next/font/google"

import { ThemeProvider } from "@/components/theme-provider"
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server"
import "@workspace/ui/globals.css"
import { cn } from "@workspace/ui/lib/utils"
import { ConvexClientProvider } from "./ConvexClientProvider"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

const notoSans = Noto_Sans({ variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={cn(
          "antialiased",
          fontMono.variable,
          "font-sans",
          notoSans.variable
        )}
      >
        <body>
          <ConvexClientProvider>
            <ThemeProvider>
              <TooltipProvider>{children}</TooltipProvider>
            </ThemeProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  )
}
