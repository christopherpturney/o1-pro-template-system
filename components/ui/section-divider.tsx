/**
 * @description
 * This component provides custom section dividers for separating content areas.
 * Matches the purple/blue design system with elegant styling options.
 *
 * Key features:
 * - Multiple divider styles (line, gradient, dot pattern)
 * - Vertical and horizontal orientation
 * - Customizable spacing and appearance
 *
 * @dependencies
 * - React: For component implementation
 * - class-variance-authority: For managing variants
 *
 * @notes
 * - Can be used to create visual hierarchy in page layouts
 * - Gradient dividers use the theme's primary and accent colors
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const dividerVariants = cva("shrink-0", {
  variants: {
    variant: {
      line: "bg-border",
      gradient: "from-primary/20 via-primary to-accent/20 bg-gradient-to-r",
      dots: "border-border border-dashed bg-transparent",
      glow: "bg-primary/50 blur-[2px]",
      faded: "via-border bg-gradient-to-r from-transparent to-transparent"
    },
    orientation: {
      horizontal: "my-8 h-px w-full",
      vertical: "mx-8 h-full w-px"
    },
    size: {
      sm: "", // Handled in compound variants
      md: "",
      lg: "",
      xl: ""
    }
  },
  compoundVariants: [
    {
      orientation: "horizontal",
      size: "sm",
      className: "my-2"
    },
    {
      orientation: "horizontal",
      size: "md",
      className: "my-4"
    },
    {
      orientation: "horizontal",
      size: "lg",
      className: "my-8"
    },
    {
      orientation: "horizontal",
      size: "xl",
      className: "my-12"
    },
    {
      orientation: "vertical",
      size: "sm",
      className: "mx-2"
    },
    {
      orientation: "vertical",
      size: "md",
      className: "mx-4"
    },
    {
      orientation: "vertical",
      size: "lg",
      className: "mx-8"
    },
    {
      orientation: "vertical",
      size: "xl",
      className: "mx-12"
    },
    {
      variant: "dots",
      className: "h-0 border-0 border-b-2 bg-transparent"
    }
  ],
  defaultVariants: {
    variant: "line",
    orientation: "horizontal",
    size: "md"
  }
})

export interface SectionDividerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dividerVariants> {
  decoratorPosition?: "left" | "center" | "right"
  showDecorator?: boolean
}

export function SectionDivider({
  className,
  variant,
  orientation,
  size,
  showDecorator = false,
  decoratorPosition = "center",
  ...props
}: SectionDividerProps) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div
        className={cn(dividerVariants({ variant, orientation, size }))}
        {...props}
      />

      {showDecorator && orientation === "horizontal" && (
        <div
          className={cn("bg-primary absolute size-2 rounded-full", {
            "left-0": decoratorPosition === "left",
            "left-1/2 -translate-x-1/2": decoratorPosition === "center",
            "right-0": decoratorPosition === "right"
          })}
        />
      )}
    </div>
  )
}

// Specialized divider with text label in the middle
export interface DividerWithTextProps
  extends Omit<SectionDividerProps, "showDecorator" | "decoratorPosition"> {
  children: React.ReactNode
}

export function DividerWithText({
  className,
  variant = "faded",
  orientation = "horizontal",
  size = "md",
  children,
  ...props
}: DividerWithTextProps) {
  return (
    <div className={cn("relative flex items-center", className)}>
      <div className="grow">
        <SectionDivider
          variant={variant}
          orientation={orientation}
          size={size}
          {...props}
        />
      </div>

      <div className="text-muted-foreground shrink-0 px-4 text-sm font-medium">
        {children}
      </div>

      <div className="grow">
        <SectionDivider
          variant={variant}
          orientation={orientation}
          size={size}
          {...props}
        />
      </div>
    </div>
  )
}
