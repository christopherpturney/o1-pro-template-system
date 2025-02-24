"use server"

/**
 * @description
 * This server component serves as the main landing page for the dashboard.
 * It provides a welcome message and quick navigation links to key dashboard features.
 *
 * Key features:
 * - Welcome Message: Greets the user and introduces the dashboard
 * - Navigation Links: Quick access to Meal Log and Meal History
 * - Layout Integration: Uses the dashboard layout with sidebar navigation
 *
 * @dependencies
 * - next/link: For client-side navigation
 * - "@/components/ui/button": For styled buttons
 *
 * @notes
 * - Marked as "use server" per project rules for server components
 * - No async data fetching required, so no Suspense is needed
 * - Assumes Clerk authentication is handled in the global layout
 */

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      {/* Welcome section */}
      <section className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Welcome to Your Dashboard</h1>
        <p className="text-muted-foreground">
          Track your meals and nutrition effortlessly with AI-powered food
          identification.
        </p>
      </section>

      {/* Quick navigation */}
      <section className="flex flex-col gap-4 sm:flex-row">
        <Button asChild>
          <Link href="/meal-log">Log a New Meal</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/meal-history">View Meal History</Link>
        </Button>
      </section>
    </div>
  )
}
