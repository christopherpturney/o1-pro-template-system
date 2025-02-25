/**
 * @description
 * This component provides container elements for layout management.
 * Matches the purple/blue design system with modern styling options.
 *
 * Key features:
 * - Multiple width variants (sm, md, lg, xl, full)
 * - Centered content with responsive padding
 * - Optional max-width constraints
 * - Support for custom padding
 *
 * @dependencies
 * - React: For component implementation
 * - class-variance-authority: For managing variants
 *
 * @notes
 * - Designed to work as a responsive wrapper for content sections
 * - Coordinates with other components for consistent layout
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const containerVariants = cva("mx-auto w-full", {
  variants: {
    size: {
      sm: "max-w-screen-sm",
      md: "max-w-screen-md",
      lg: "max-w-screen-lg",
      xl: "max-w-screen-xl",
      "2xl": "max-w-screen-2xl",
      full: "max-w-none"
    },
    padding: {
      none: "px-0",
      sm: "px-4",
      md: "px-6",
      lg: "px-8",
      xl: "px-12"
    },
    centered: {
      true: "flex flex-col items-center justify-center",
      false: ""
    }
  },
  defaultVariants: {
    size: "lg",
    padding: "md",
    centered: false
  }
})

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {}

export function Container({
  className,
  size,
  padding,
  centered,
  children,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(containerVariants({ size, padding, centered, className }))}
      {...props}
    >
      {children}
    </div>
  )
}

// Section container for content blocks
export interface SectionProps extends ContainerProps {
  as?: React.ElementType
  spacing?: "sm" | "md" | "lg" | "xl"
}

export function Section({
  className,
  as: Component = "section",
  size,
  padding,
  centered,
  spacing = "lg",
  children,
  ...props
}: SectionProps) {
  const spacingClasses = {
    sm: "py-8",
    md: "py-12",
    lg: "py-16",
    xl: "py-24"
  }

  return (
    <Component className={cn(spacingClasses[spacing])} {...props}>
      <Container
        size={size}
        padding={padding}
        centered={centered}
        className={className}
      >
        {children}
      </Container>
    </Component>
  )
}

// Hero container for landing page sections
export interface HeroProps extends ContainerProps {
  fullHeight?: boolean
  withBackground?: boolean
  backgroundClassName?: string
}

export function Hero({
  className,
  size = "xl",
  padding = "lg",
  centered = true,
  fullHeight = false,
  withBackground = false,
  backgroundClassName,
  children,
  ...props
}: HeroProps) {
  return (
    <div
      className={cn(
        "relative",
        fullHeight && "flex min-h-[90vh] items-center",
        className
      )}
      {...props}
    >
      {withBackground && (
        <div
          className={cn("absolute inset-0 -z-10", backgroundClassName)}
          aria-hidden="true"
        />
      )}

      <Container size={size} padding={padding} centered={centered}>
        {children}
      </Container>
    </div>
  )
}
