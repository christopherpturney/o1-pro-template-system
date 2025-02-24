"use client"

/**
 * @description
 * A reusable loading spinner component that uses Framer Motion for smooth animations.
 * Can be customized with different sizes and colors through props.
 *
 * @example
 * // Default usage
 * <LoadingSpinner />
 *
 * // Custom size and color
 * <LoadingSpinner size="lg" color="primary" />
 *
 * @dependencies
 * - framer-motion: For smooth animations
 * - class-variance-authority: For style variants
 * - tailwind-merge: For class name merging
 */

import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"

const spinnerVariants = cva(
  "inline-block animate-spin rounded-full border-2 border-solid",
  {
    variants: {
      size: {
        sm: "size-4",
        md: "size-6",
        lg: "size-8",
        xl: "size-12"
      },
      color: {
        default:
          "border-gray-200 border-t-gray-600 dark:border-gray-700 dark:border-t-gray-300",
        primary:
          "border-blue-200 border-t-blue-600 dark:border-blue-700 dark:border-t-blue-300",
        secondary:
          "border-purple-200 border-t-purple-600 dark:border-purple-700 dark:border-t-purple-300"
      }
    },
    defaultVariants: {
      size: "md",
      color: "default"
    }
  }
)

interface LoadingSpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string
}

export function LoadingSpinner({
  size,
  color,
  className
}: LoadingSpinnerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(spinnerVariants({ size, color }), className)}
    />
  )
}
