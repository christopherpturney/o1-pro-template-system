"use client"

/**
 * @description
 * A specialized card component for displaying food items and their nutritional information.
 * Features:
 * - Displays food name, calories, and macronutrients
 * - Optional image display
 * - Expandable details
 * - Edit/delete actions
 * - Displays AI confidence score when available
 *
 * @example
 * <FoodCard
 *   food={{
 *     name: "Banana",
 *     calories: 105,
 *     protein: 1.3,
 *     carbs: 27,
 *     fat: 0.3,
 *     imageUrl: "/banana.jpg",
 *     confidence: 0.95
 *   }}
 *   onEdit={() => {}}
 *   onDelete={() => {}}
 * />
 *
 * @dependencies
 * - framer-motion: For animations
 * - lucide-react: For icons
 */

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { ChevronDown, Edit2, Trash } from "lucide-react"
import { useState } from "react"
import { Button } from "./button"
import { Card, CardContent, CardHeader } from "./card"

export interface FoodItem {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  imageUrl?: string
  detectedViaAI?: boolean
  confidence?: number
  source?: "USDA" | "OpenFoodFacts" | "default"
}

interface FoodCardProps {
  food: FoodItem
  onEdit?: () => void
  onDelete?: () => void
  className?: string
}

export function FoodCard({ food, onEdit, onDelete, className }: FoodCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpanded = () => setIsExpanded(!isExpanded)

  // Format confidence as percentage if available
  const confidenceDisplay =
    food.confidence !== undefined
      ? `${Math.round(food.confidence * 100)}%`
      : null

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <h4 className="text-sm font-medium leading-none">{food.name}</h4>
          {food.detectedViaAI && (
            <span className="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs">
              AI Detected
            </span>
          )}
          {confidenceDisplay && (
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800 dark:bg-green-900 dark:text-green-100">
              {confidenceDisplay}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="size-8"
            >
              <Edit2 className="size-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="text-destructive size-8"
            >
              <Trash className="size-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleExpanded}
            className={cn(
              "size-8 transition-transform",
              isExpanded && "rotate-180"
            )}
          >
            <ChevronDown className="size-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-gray-500">Calories</span>
          <span className="text-sm font-medium">{food.calories} kcal</span>
        </div>

        <motion.div
          initial={false}
          animate={{ height: isExpanded ? "auto" : 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Protein</span>
              <span className="text-sm">{food.protein}g</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Carbs</span>
              <span className="text-sm">{food.carbs}g</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Fat</span>
              <span className="text-sm">{food.fat}g</span>
            </div>
          </div>

          {food.imageUrl && (
            <div className="mt-4">
              <img
                src={food.imageUrl}
                alt={food.name}
                className="h-32 w-full rounded-md object-cover"
              />
            </div>
          )}
        </motion.div>
      </CardContent>
    </Card>
  )
}
