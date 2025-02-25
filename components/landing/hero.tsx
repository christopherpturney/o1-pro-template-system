/**
 * @description
 * This client component provides the hero section for the AI Food Identifier & Nutrition Tracker landing page.
 * It showcases the app's value proposition with:
 * - A headline and description promoting food identification and nutrition tracking
 * - A call-to-action button
 * - An animated video dialog showcasing the app's functionality, starting at a specified timestamp
 *
 * Key features:
 * - Animations: Uses Framer Motion for smooth entrance effects
 * - Video Dialog: Integrates a clickable thumbnail opening a video modal with optional start time
 * - Responsive Design: Mobile-friendly layout per project requirements
 *
 * @dependencies
 * - framer-motion: For animation effects
 * - lucide-react: For icons (ChevronRight, Rocket)
 * - next/link: For navigation
 * - "@/components/magicui/animated-gradient-text": For animated text effects
 * - "@/components/magicui/hero-video-dialog": For video modal functionality
 *
 * @notes
 * - Marked as "use client" due to client-side interactivity and animations
 * - Video and thumbnail sources are placeholders; update with actual assets
 * - Design aligns with minimalist and mobile-friendly requirements
 */

"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { ChevronRight, Rocket } from "lucide-react"
import Link from "next/link"
import AnimatedGradientText from "../magicui/animated-gradient-text"
import HeroVideoDialog from "../magicui/hero-video-dialog"

export const HeroSection = () => {
  return (
    <div className="flex flex-col items-center justify-center px-8 pt-32 text-center">
      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="mt-8 flex max-w-2xl flex-col items-center justify-center gap-6"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className="text-balance text-6xl font-bold"
        >
          AI Food Identifier
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
          className="max-w-xl text-balance text-xl"
        >
          Snap a photo of your meal and instantly get nutritional insights with
          AI.
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
        >
          <Link href="/signup">
            <Button className="bg-purple-600 text-lg hover:bg-purple-700">
              <Rocket className="mr-2 size-5" />
              Get Started →
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Video Dialog with Start Time */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1, ease: "easeOut" }}
        className="mx-auto mt-20 flex w-full max-w-screen-lg items-center justify-center rounded-lg border shadow-lg"
      >
        <HeroVideoDialog
          animationStyle="top-in-bottom-out"
          videoSrc="https://www.youtube.com/embed/0Fs-4GiNxQ8"
          thumbnailSrc="/food-id-thumbnail.png"
          thumbnailAlt="AI Food Identification Demo"
          startTime={30} // Starts the video at 30 seconds
        />
      </motion.div>
    </div>
  )
}
