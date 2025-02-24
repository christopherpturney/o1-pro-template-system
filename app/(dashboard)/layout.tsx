"use client"

/**
 * @description
 * This client component provides the layout for the dashboard section of the app.
 * It includes a responsive sidebar for navigation and a main content area for rendering child components.
 *
 * Key features:
 * - Responsive Design: Sidebar is fixed on desktop and toggleable on mobile
 * - Navigation: Links to key dashboard sections (Meal Log, Meal History, Settings)
 * - Integration: Works within the global layout, inheriting theme and authentication
 *
 * @dependencies
 * - react: For state management (useState)
 * - next/link: For client-side navigation
 * - lucide-react: For icons (Menu, X)
 * - "@/components/ui/button": For styled buttons
 *
 * @notes
 * - Marked as "use client" due to client-side state for sidebar toggle
 * - Uses Tailwind CSS for responsive styling
 * - Assumes global layout provides header and footer
 */

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // State to manage sidebar visibility on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`bg-background fixed inset-y-0 left-0 z-50 w-64${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } border-r transition-transform duration-300 ease-in-out md:relative md:translate-x-0`}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar header with close button on mobile */}
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold">Dashboard</h2>
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
              href="/dashboard/meal-log"
              className="hover:bg-muted block rounded-md p-2"
            >
              Meal Log
            </Link>
            <Link
              href="/dashboard/meal-history"
              className="hover:bg-muted block rounded-md p-2"
            >
              Meal History
            </Link>
            <Link
              href="/dashboard/settings"
              className="hover:bg-muted block rounded-md p-2"
            >
              Settings
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1">
        {/* Mobile header with menu toggle */}
        <header className="bg-background flex items-center justify-between border-b p-4 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <h1 className="text-lg font-semibold">AI Food ID</h1>
        </header>
        {/* Render child components (specific dashboard pages) */}
        <main className="p-4">{children}</main>
      </div>
    </div>
  )
}
