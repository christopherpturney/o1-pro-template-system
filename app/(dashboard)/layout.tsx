"use client"

/**
 * @description
 * This client component provides the layout for the dashboard section of the app.
 * It includes a responsive sidebar for navigation and a main content area for rendering child components.
 *
 * Key features:
 * - Responsive Design: Sidebar is fixed on desktop and toggleable on mobile
 * - Navigation: Links to dashboard sections (Dashboard, Meal Log, Meal History, Settings)
 * - Integration: Works within the global layout, inheriting theme and authentication
 *
 * @dependencies
 * - react: For state management (useState, useEffect)
 * - next/link: For client-side navigation
 * - lucide-react: For icons (Menu, X, Utensils)
 * - "@/components/ui/button": For styled buttons
 * - "@clerk/nextjs": For authentication components (UserButton)
 *
 * @notes
 * - Marked as "use client" due to client-side state for sidebar toggle
 * - Uses Tailwind CSS for responsive styling
 * - Coordinates with the global header to prevent duplicate navigation on mobile
 * - Includes Clerk authentication button in the upper right corner
 */

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, Utensils, X } from "lucide-react"
import { UserButton } from "@clerk/nextjs"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // State to manage sidebar visibility on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Handle global header's dashboard detection
  useEffect(() => {
    // This sets a data attribute that the header component can check
    // to know we're in a dashboard route
    document.body.setAttribute("data-in-dashboard", "true")

    return () => {
      document.body.removeAttribute("data-in-dashboard")
    }
  }, [])

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`bg-background fixed inset-y-0 left-0 z-50 w-64 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } border-r transition-transform duration-300 ease-in-out md:relative md:translate-x-0`}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar header with app name and icon */}
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center space-x-2">
              <Utensils className="size-5" />
              <h2 className="text-lg font-semibold">AI Food ID</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="size-5" />
            </Button>
          </div>
          {/* Navigation links */}
          <nav className="flex-1 space-y-2 p-4">
            <Link
              href="/dashboard"
              className="hover:bg-muted block rounded-md p-2"
            >
              Dashboard
            </Link>
            <Link
              href="/meal-log"
              className="hover:bg-muted block rounded-md p-2"
            >
              Meal Log
            </Link>
            <Link
              href="/meal-history"
              className="hover:bg-muted block rounded-md p-2"
            >
              Meal History
            </Link>
            <Link
              href="/settings"
              className="hover:bg-muted block rounded-md p-2"
            >
              Settings
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1">
        {/* Dashboard header with menu toggle on mobile and auth button */}
        <header className="bg-background flex items-center justify-between border-b p-4">
          <div className="flex items-center">
            {/* Mobile sidebar toggle button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="size-5" />
            </Button>
          </div>

          {/* User authentication button */}
          <div className="flex items-center">
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        {/* Render child components (specific dashboard pages) */}
        <main className="p-4">{children}</main>
      </div>
    </div>
  )
}
