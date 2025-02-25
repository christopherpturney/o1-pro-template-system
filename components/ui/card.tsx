/**
 * @description
 * This component provides card elements for displaying content in boxes.
 * Enhanced to match the new purple/blue design system with modern styling.
 *
 * Key features:
 * - Multiple card variants through prop combinations
 * - Elegant styling with subtle shadows and rounded corners
 * - Support for hover effects and animations
 * - Consistent spacing and typography
 *
 * @dependencies
 * - React: For component implementation
 * - class-variance-authority: For managing variants
 *
 * @notes
 * - Added hover effect options
 * - Added glass effect option for transparent cards
 * - Added border glow effect option
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardVariants = cva("rounded-xl transition-all duration-200", {
  variants: {
    variant: {
      default: "bg-card text-card-foreground shadow-card border",
      outline: "border-border border bg-transparent",
      ghost: "border-none bg-transparent shadow-none",
      glass: "glass-effect backdrop-blur-md",
      filled: "bg-secondary/50 text-secondary-foreground",
      gradient:
        "from-primary/10 to-accent/10 bg-gradient-to-br backdrop-blur-sm"
    },
    hover: {
      default: "",
      lift: "hover:shadow-glossy hover:-translate-y-1",
      glow: "hover:border-primary/50 hover:purple-glow",
      zoom: "hover:scale-[1.02]",
      none: ""
    }
  },
  defaultVariants: {
    variant: "default",
    hover: "default"
  }
})

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, hover, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, hover, className }))}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-muted-foreground text-sm", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
