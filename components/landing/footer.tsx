/**
 * @description
 * This server component provides the footer for the AI Food Identifier & Nutrition Tracker app.
 * It offers a simple, static layout with:
 * - Navigation links grouped by category (Company, Product, Resources, Social)
 * - A copyright notice
 *
 * Key features:
 * - Minimalist Design: Clean and uncluttered, per design requirements
 * - Static Content: No interactive elements, suitable for server rendering
 *
 * @dependencies
 * - lucide-react: For social media icons (Github, Twitter)
 * - next/link: For navigation links
 *
 * @notes
 * - Marked as "use server" per project rules for server components
 * - Links are tailored to the app’s scope, omitting irrelevant sections
 * - No async operations, so no Suspense is needed
 */

"use server"

import { Github, Twitter } from "lucide-react"
import Link from "next/link"

export async function Footer() {
  return (
    <footer className="border-t">
      <div className="container mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Company Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Company</h3>
            <div className="flex flex-col gap-2">
              <Link
                href="/about"
                className="text-muted-foreground hover:text-foreground transition"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-muted-foreground hover:text-foreground transition"
              >
                Contact
              </Link>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Product</h3>
            <div className="flex flex-col gap-2">
              <Link
                href="/features"
                className="text-muted-foreground hover:text-foreground transition"
              >
                Features
              </Link>
              <Link
                href="/pricing"
                className="text-muted-foreground hover:text-foreground transition"
              >
                Pricing
              </Link>
            </div>
          </div>

          {/* Resources Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Resources</h3>
            <div className="flex flex-col gap-2">
              <Link
                href="/support"
                className="text-muted-foreground hover:text-foreground transition"
              >
                Support
              </Link>
              <Link
                href="/terms"
                className="text-muted-foreground hover:text-foreground transition"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="text-muted-foreground hover:text-foreground transition"
              >
                Privacy
              </Link>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Social</h3>
            <div className="flex gap-4">
              <Link
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="text-muted-foreground hover:text-foreground size-6 transition" />
              </Link>
              <Link
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter className="text-muted-foreground hover:text-foreground size-6 transition" />
              </Link>
            </div>
          </div>
        </div>

        {/* Copyright Notice */}
        <div className="text-muted-foreground mt-12 pt-8 text-center">
          <p>&copy; 2025 AI Food ID. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
