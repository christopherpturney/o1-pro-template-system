/**
 * @description
 * This client component serves as the header for the AI Food Identifier & Nutrition Tracker app.
 * It provides navigation and authentication controls, featuring:
 * - A logo and app name linking to the homepage
 * - Responsive navigation with links tailored to the app
 * - Clerk authentication buttons (Sign In, Sign Up, User profile)
 * - Mobile menu toggle with animations
 *
 * Key features:
 * - Responsive Design: Adapts to mobile with a collapsible menu
 * - Authentication: Integrates Clerk's sign-in/up and user profile components
 * - Animations: Uses Framer Motion for smooth transitions
 * - Dashboard Awareness: Hides itself completely when in dashboard routes to avoid duplicate navigation
 *
 * @dependencies
 * - @clerk/nextjs: For authentication components (SignedIn, SignedOut, etc.)
 * - framer-motion: For animation effects
 * - lucide-react: For icons (Menu, X, Utensils)
 * - next/link: For client-side navigation
 *
 * @notes
 * - Marked as "use client" due to interactive client-side logic
 * - Navigation links are customized for this app's features
 * - Scroll-based styling adds a shadow and blur effect when scrolled
 * - Coordinates with dashboard layout using data-in-dashboard attribute
 */

"use client"

import { Button } from "@/components/ui/button"
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton
} from "@clerk/nextjs"
import { motion } from "framer-motion"
import { Menu, Utensils, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

// Navigation links for all users
const navLinks = [{ href: "/pricing", label: "Pricing" }]

// Additional links for signed-in users
const signedInLinks = [{ href: "/dashboard", label: "Dashboard" }]

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isInDashboard, setIsInDashboard] = useState(false)

  // Toggle mobile menu visibility
  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev)
  }

  // Handle scroll effect for header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Check if we're in the dashboard section based on the data attribute
  useEffect(() => {
    // Initial check
    setIsInDashboard(document.body.hasAttribute("data-in-dashboard"))

    // Watch for attribute changes
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.attributeName === "data-in-dashboard") {
          setIsInDashboard(document.body.hasAttribute("data-in-dashboard"))
        }
      })
    })

    observer.observe(document.body, { attributes: true })

    return () => observer.disconnect()
  }, [])

  // Don't render the header at all if we're in the dashboard
  if (isInDashboard) {
    return null
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`sticky top-0 z-50 transition-colors ${
        isScrolled
          ? "bg-background/80 shadow-sm backdrop-blur-sm"
          : "bg-background"
      }`}
    >
      <div className="container mx-auto flex max-w-7xl items-center justify-between p-4">
        {/* Logo and App Name */}
        <motion.div
          className="flex items-center space-x-2 hover:cursor-pointer hover:opacity-80"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Utensils className="size-6" />
          <Link href="/" className="text-xl font-bold">
            AI Food ID
          </Link>
        </motion.div>

        {/* Desktop Navigation */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 space-x-2 md:flex">
          {navLinks.map(link => (
            <motion.div
              key={link.href}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href={link.href}
                className="text-muted-foreground hover:text-foreground rounded-full px-3 py-1 transition"
              >
                {link.label}
              </Link>
            </motion.div>
          ))}
          <SignedIn>
            {signedInLinks.map(link => (
              <motion.div
                key={link.href}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground rounded-full px-3 py-1 transition"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </SignedIn>
        </nav>

        {/* Authentication and Mobile Menu Toggle */}
        <div className="flex items-center space-x-4">
          <SignedOut>
            <SignInButton>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button variant="ghost">Sign In</Button>
              </motion.div>
            </SignInButton>
            <SignUpButton>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Get Started
                </Button>
              </motion.div>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
          <motion.div
            className="md:hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="size-6" />
              ) : (
                <Menu className="size-6" />
              )}
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-primary-foreground text-primary p-4 md:hidden"
        >
          <ul className="space-y-2">
            <li>
              <Link
                href="/"
                className="block hover:underline"
                onClick={toggleMenu}
              >
                Home
              </Link>
            </li>
            {navLinks.map(link => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block hover:underline"
                  onClick={toggleMenu}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <SignedIn>
              {signedInLinks.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block hover:underline"
                    onClick={toggleMenu}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </SignedIn>
          </ul>
        </motion.nav>
      )}
    </motion.header>
  )
}
