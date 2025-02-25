/**
 * @description
 * This component provides badge elements for displaying status, labels, or small pieces of information.
 * Enhanced to match the new purple/blue design system with modern styling.
 *
 * Key features:
 * - Multiple badge variants for different visual emphasis
 * - Soft and solid color options
 * - Gradient effect option
 * - Configurable sizes
 *
 * @dependencies
 * - class-variance-authority: For managing component variants
 * - React: For component implementation
 *
 * @notes
 * - Added soft color variants with lower opacity
 * - Added gradient option for emphasis
 * - Improved hover states
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 border-transparent",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/90 border-transparent",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-transparent",
        outline: "border-border text-foreground hover:bg-secondary/10",
        soft: "bg-primary/10 text-primary hover:bg-primary/20 border-transparent",
        "soft-secondary":
          "bg-secondary/20 text-secondary-foreground hover:bg-secondary/30 border-transparent",
        "soft-accent":
          "bg-accent/10 text-accent hover:bg-accent/20 border-transparent",
        gradient: "bg-gradient-hero border-transparent text-white",
        ghost: "text-muted-foreground hover:bg-secondary/10 border-transparent"
      },
      size: {
        default: "h-6 px-2.5 py-0.5 text-xs",
        sm: "h-5 px-2 py-px text-[10px]",
        lg: "h-7 px-3 py-1 text-sm"
      },
      withDot: {
        true: "pl-1.5",
        false: ""
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      withDot: false
    }
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dotColor?: string
}

function Badge({
  className,
  variant,
  size,
  withDot = false,
  dotColor,
  children,
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size, withDot }), className)}
      {...props}
    >
      {withDot && (
        <div
          className={cn(
            "mr-1 size-1.5 rounded-full",
            dotColor ||
              (variant === "soft" ||
              variant === "soft-secondary" ||
              variant === "soft-accent"
                ? "bg-current"
                : "bg-current opacity-50")
          )}
        />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
