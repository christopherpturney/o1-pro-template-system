/**
 * @description
 * This component provides gradient text elements with various styles.
 * Creates beautiful text effects matching the purple/blue design system.
 *
 * Key features:
 * - Static gradient: Text with a static color gradient
 * - Animated gradient: Text with animated gradient colors
 * - Highlight: Text with a colored highlight/underline
 * - Various preset gradient styles
 *
 * @dependencies
 * - React: For component implementation
 * - class-variance-authority: For managing variants
 * - framer-motion: For animations (optional)
 *
 * @notes
 * - Designed to work with headings and emphasized text
 * - Uses the primary and accent colors from the theme
 */

"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

// Static gradient text component
const gradientTextVariants = cva("inline-block bg-clip-text text-transparent", {
  variants: {
    variant: {
      default: "from-primary to-accent bg-gradient-to-r",
      accent: "from-accent to-primary bg-gradient-to-r",
      reverse: "from-primary to-accent bg-gradient-to-l",
      primary: "from-primary via-primary/80 to-primary bg-gradient-to-r",
      rainbow: "from-primary via-accent bg-gradient-to-r to-[#FF9D70]",
      subtle:
        "from-foreground via-foreground/80 to-foreground/60 bg-gradient-to-r"
    },
    size: {
      default: "text-base",
      sm: "text-sm",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
      "3xl": "text-3xl",
      "4xl": "text-4xl",
      "5xl": "text-5xl"
    },
    weight: {
      default: "font-medium",
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
      extrabold: "font-extrabold"
    }
  },
  defaultVariants: {
    variant: "default",
    size: "default",
    weight: "default"
  }
})

export interface GradientTextProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof gradientTextVariants> {}

export function GradientText({
  className,
  variant,
  size,
  weight,
  children,
  ...props
}: GradientTextProps) {
  return (
    <span
      className={cn(gradientTextVariants({ variant, size, weight, className }))}
      {...props}
    >
      {children}
    </span>
  )
}

// Animated gradient text component
export interface AnimatedGradientTextProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    Omit<VariantProps<typeof gradientTextVariants>, "variant"> {
  duration?: number
}

export function AnimatedGradientText({
  className,
  size,
  weight,
  children,
  duration = 8,
  ...props
}: AnimatedGradientTextProps) {
  return (
    <span
      className={cn(
        "animate-gradient inline-block bg-[length:var(--bg-size)_100%] bg-clip-text text-transparent",
        "from-primary via-accent to-primary bg-gradient-to-r [--bg-size:300%]",
        gradientTextVariants({ size, weight, className })
      )}
      style={{
        animationDuration: `${duration}s`
      }}
      {...props}
    >
      {children}
    </span>
  )
}

// Highlighted gradient text
export interface HighlightedTextProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof gradientTextVariants> {
  highlightClassName?: string
  highlight?: boolean
  highlightOffset?: string
  highlightHeight?: string
  animated?: boolean
}

export function HighlightedText({
  className,
  highlightClassName,
  variant,
  size,
  weight,
  children,
  highlight = true,
  highlightOffset = "95%",
  highlightHeight = "0.3em",
  animated = false,
  ...props
}: HighlightedTextProps) {
  const textRef = React.useRef<HTMLSpanElement>(null)

  return (
    <span className="relative inline-block" {...props}>
      {highlight && (
        <motion.span
          initial={animated ? { width: 0 } : { width: "100%" }}
          animate={animated ? { width: "100%" } : {}}
          transition={animated ? { duration: 0.8, delay: 0.2 } : {}}
          className={cn(
            "absolute bottom-0 left-0 -z-10 block h-[0.3em] w-full rounded-sm opacity-30",
            variant === "accent" || variant === "rainbow"
              ? "bg-accent"
              : "bg-primary",
            highlightClassName
          )}
          style={{
            bottom: highlightOffset,
            height: highlightHeight
          }}
        />
      )}
      <span
        ref={textRef}
        className={cn(
          gradientTextVariants({ variant, size, weight }),
          className
        )}
      >
        {children}
      </span>
    </span>
  )
}
