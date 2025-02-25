/**
 * @description
 * This component provides button elements with various styles and sizes.
 * Enhanced to match the new purple/blue design system with modern styling.
 *
 * Key features:
 * - Multiple variants: default, destructive, outline, secondary, ghost, link, gradient
 * - Various sizes: default, sm, lg, icon
 * - Support for icons and loading states
 * - Configurable shadow effects
 *
 * @dependencies
 * - class-variance-authority: For managing component variants
 * - Radix UI Slot: For prop forwarding
 * - lucide-react: For loading spinner icon
 *
 * @notes
 * - Added glow effect to primary buttons
 * - Added gradient variant for highlighting key actions
 * - Improved hover and focus states
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  "ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-blue",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border-input bg-background hover:bg-primary/5 hover:border-primary border-secondary/50 text-foreground border-2",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-primary/5 text-foreground hover:text-primary",
        link: "text-primary underline-offset-4 hover:underline",
        gradient:
          "bg-gradient-hero shadow-purple text-white hover:brightness-105",
        soft: "bg-primary/10 text-primary hover:bg-primary/20"
      },
      size: {
        default: "h-10 px-5 py-2.5",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "size-10 rounded-full",
        pill: "h-10 rounded-full px-6 py-2"
      },
      withShadow: {
        true: "", // Handles in compound variants
        false: ""
      },
      isLoading: {
        true: "cursor-not-allowed opacity-70",
        false: ""
      }
    },
    compoundVariants: [
      {
        variant: "default",
        withShadow: true,
        className: "shadow-blue"
      },
      {
        variant: "gradient",
        withShadow: true,
        className: "shadow-purple"
      },
      {
        isLoading: true,
        className: "cursor-not-allowed opacity-70"
      }
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      withShadow: false,
      isLoading: false
    }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
  withShadow?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      withShadow = false,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, isLoading, withShadow, className })
        )}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
