/**
 * @description
 * This is the root layout for the AI Food Identifier & Nutrition Tracker app.
 * It provides the global structure for all pages, including:
 * - Authentication handling via Clerk
 * - Theme management via Next Themes
 * - A consistent header and footer
 * - Toast notifications and Tailwind indicators (dev mode)
 *
 * Key features:
 * - Authentication: Checks user ID and creates a profile if none exists
 * - Theming: Supports light/dark modes via Providers component
 * - Layout: Includes Header and Footer components for consistent navigation
 *
 * @dependencies
 * - @clerk/nextjs: For authentication management (ClerkProvider, auth)
 * - "@/components/landing/header": Custom header component
 * - "@/components/landing/footer": Custom footer component
 * - "@/components/utilities/providers": Theme provider wrapper
 * - "@/actions/db/profiles-actions": Server actions for profile management
 *
 * @notes
 * - Removed "use server" from file level to allow metadata export
 * - Server-side logic is handled by imported actions marked "use server"
 * - Metadata is defined statically here as per Next.js convention
 */

import { ClerkProvider } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import { Inter } from "next/font/google"
import type { Metadata } from "next"
import { cn } from "@/lib/utils"
import Header from "@/components/landing/header"
import { Footer } from "@/components/landing/footer"
import { Providers } from "@/components/utilities/providers"
import { Toaster } from "@/components/ui/toaster"
import { TailwindIndicator } from "@/components/utilities/tailwind-indicator"
import {
  createProfileAction,
  getProfileByUserIdAction
} from "@/actions/db/profiles-actions"
import "./globals.css"

// Initialize Inter font with Latin subset
const inter = Inter({ subsets: ["latin"] })

// Define metadata for the application
export const metadata: Metadata = {
  title: "AI Food Identifier & Nutrition Tracker",
  description:
    "A mobile-friendly web app to identify food from images and track nutritional information."
}

// Root layout component
export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  // Get user authentication details
  const { userId } = await auth()

  // If user is authenticated, ensure they have a profile
  if (userId) {
    const profileRes = await getProfileByUserIdAction(userId)
    if (!profileRes.isSuccess) {
      await createProfileAction({ userId })
    }
  }

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={cn(
            "bg-background mx-auto min-h-screen w-full scroll-smooth antialiased",
            inter.className
          )}
        >
          <Providers
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>

            <TailwindIndicator />
            <Toaster />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
