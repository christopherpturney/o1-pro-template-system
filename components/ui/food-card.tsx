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
 * - Adjustable quantity with proportional nutrition updates
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
import { ChevronDown, Edit2, Minus, Plus, Trash } from "lucide-react"
import { useState } from "react"
import { Button } from "./button"
import { Card, CardContent, CardHeader } from "./card"
import { Input } from "./input"

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
  sourceId?: string
  description?: string
  quantity?: number
}

interface FoodCardProps {
  food: FoodItem
  onEdit?: () => void
  onDelete?: () => void
  onQuantityChange?: (food: FoodItem, quantity: number) => void
  className?: string
  readOnly?: boolean
}

export function FoodCard({
  food,
  onEdit,
  onDelete,
  onQuantityChange,
  className,
  readOnly = false
}: FoodCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [quantity, setQuantity] = useState<number>(food.quantity || 1)
  const [baseValues] = useState({
    calories: food.calories / (food.quantity || 1),
    protein: food.protein / (food.quantity || 1),
    carbs: food.carbs / (food.quantity || 1),
    fat: food.fat / (food.quantity || 1)
  })

  const toggleExpanded = () => setIsExpanded(!isExpanded)

  const confidenceDisplay =
    food.confidence !== undefined
      ? `${Math.round(food.confidence * 100)}%`
      : null

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity > 0) {
      setQuantity(newQuantity)

      if (onQuantityChange) {
        const updatedFood: FoodItem = {
          ...food,
          quantity: newQuantity,
          calories: baseValues.calories * newQuantity,
          protein: baseValues.protein * newQuantity,
          carbs: baseValues.carbs * newQuantity,
          fat: baseValues.fat * newQuantity
        }
        onQuantityChange(updatedFood, newQuantity)
      }
    }
  }

  const currentValues = {
    calories: baseValues.calories * quantity,
    protein: baseValues.protein * quantity,
    carbs: baseValues.carbs * quantity,
    fat: baseValues.fat * quantity
  }

  // Generate source link and tooltip based on food source
  const getSourceLink = () => {
    if (!food.source || food.source === "default") return null

    let linkUrl = ""
    let linkText = ""

    if (food.source === "USDA") {
      // Use sourceId (which should be fdcId from the USDA API)
      if (food.sourceId) {
        linkUrl = `https://fdc.nal.usda.gov/food-details/${food.sourceId}/nutrients`
        linkText = "USDA FoodData Central"
      } else {
        // No link if sourceId is missing
        return null
      }
    } else if (food.source === "OpenFoodFacts") {
      if (food.sourceId) {
        linkUrl = `https://world.openfoodfacts.org/product/${food.sourceId}`
        linkText = "OpenFoodFacts"
      } else {
        return null
      }
    } else {
      // No recognized source
      return null
    }

    return linkUrl ? (
      <div className="mt-3 border-t pt-2 text-xs text-gray-500">
        <div className="group relative inline-block">
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {linkText}
          </a>
          {food.description && (
            <div className="invisible absolute bottom-full left-1/2 mb-2 w-48 -translate-x-1/2 rounded bg-black p-2 text-center text-white shadow-lg group-hover:visible">
              {food.description}
              <div className="absolute left-1/2 top-full -mt-1 -translate-x-1/2 border-4 border-transparent border-t-black"></div>
            </div>
          )}
        </div>
      </div>
    ) : null
  }

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
          {onEdit && !readOnly && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="size-8"
            >
              <Edit2 className="size-4" />
            </Button>
          )}
          {onDelete && !readOnly && (
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
          <span className="text-sm font-medium">
            {currentValues.calories.toFixed(0)} kcal
          </span>
        </div>

        {!readOnly && (
          <div className="flex items-center justify-between border-t py-2">
            <span className="text-sm text-gray-500">Servings</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="size-6 rounded-full"
                onClick={() => handleQuantityChange(quantity - 0.5)}
                disabled={quantity <= 0.5}
              >
                <Minus className="size-3" />
              </Button>
              <Input
                type="number"
                value={quantity}
                min={0.5}
                step={0.5}
                onChange={e => {
                  const val = parseFloat(e.target.value)
                  if (!isNaN(val) && val > 0) {
                    handleQuantityChange(val)
                  }
                }}
                className="h-8 w-16 text-center"
              />
              <Button
                variant="outline"
                size="icon"
                className="size-6 rounded-full"
                onClick={() => handleQuantityChange(quantity + 0.5)}
              >
                <Plus className="size-3" />
              </Button>
            </div>
          </div>
        )}

        <motion.div
          initial={false}
          animate={{ height: isExpanded ? "auto" : 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Protein</span>
              <span className="text-sm">
                {currentValues.protein.toFixed(1)}g
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Carbs</span>
              <span className="text-sm">{currentValues.carbs.toFixed(1)}g</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Fat</span>
              <span className="text-sm">{currentValues.fat.toFixed(1)}g</span>
            </div>

            {/* Source link with tooltip */}
            {getSourceLink()}
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
