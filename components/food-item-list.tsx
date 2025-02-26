/**
 * @description
 * Food item list component that displays detected food items and allows users to edit or remove them.
 * It also displays nutritional summary and supports adding custom food items.
 *
 * Features:
 * - Display list of food items with their nutritional information
 * - Edit existing food items
 * - Remove food items
 * - Add custom food items
 * - Show nutritional summary (total calories, protein, carbs, fat)
 *
 * @dependencies
 * - FoodCard: For displaying individual food items
 * - Dialog: For edit modal
 * - Form: For editing food item details
 * - Button: For actions
 * - Lucide icons: For UI elements
 * - Framer Motion: For animations
 *
 * @notes
 * - Handles both AI-detected and manually added food items
 * - Includes validation for food item input
 * - Maintains running total of nutritional information
 */

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FoodCard, FoodItem } from "@/components/ui/food-card"
import { motion, AnimatePresence } from "framer-motion"
import { PlusCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Form schema for food item validation
const foodItemSchema = z.object({
  name: z.string().min(1, "Food name is required"),
  calories: z.coerce.number().min(0, "Must be a positive number"),
  protein: z.coerce.number().min(0, "Must be a positive number"),
  carbs: z.coerce.number().min(0, "Must be a positive number"),
  fat: z.coerce.number().min(0, "Must be a positive number")
})

type FoodItemFormValues = z.infer<typeof foodItemSchema>

interface FoodItemListProps {
  initialFoodItems?: FoodItem[]
  onFoodItemsChange?: (foodItems: FoodItem[]) => void
  onSaveMeal?: () => void
  readOnly?: boolean
  className?: string
}

export function FoodItemList({
  initialFoodItems = [],
  onFoodItemsChange,
  onSaveMeal,
  readOnly = false,
  className = ""
}: FoodItemListProps) {
  // State for managing food items list
  const [foodItems, setFoodItems] = useState<FoodItem[]>(initialFoodItems)

  // State for managing edit dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentFoodItem, setCurrentFoodItem] = useState<FoodItem | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [isNewItem, setIsNewItem] = useState(false)

  // Form for editing food items
  const form = useForm<FoodItemFormValues>({
    resolver: zodResolver(foodItemSchema),
    defaultValues: {
      name: "",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    }
  })

  // Calculate nutrition totals
  const nutritionTotals = foodItems.reduce(
    (acc, item) => {
      return {
        calories: acc.calories + (item.calories || 0),
        protein: acc.protein + (item.protein || 0),
        carbs: acc.carbs + (item.carbs || 0),
        fat: acc.fat + (item.fat || 0)
      }
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  // Handle opening edit dialog
  const handleEdit = (item: FoodItem, index: number) => {
    setCurrentFoodItem(item)
    setEditingIndex(index)
    setIsNewItem(false)

    // Set form values
    form.reset({
      name: item.name,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat
    })

    setIsDialogOpen(true)
  }

  // Handle deleting a food item
  const handleDelete = (index: number) => {
    const newFoodItems = [...foodItems]
    newFoodItems.splice(index, 1)
    setFoodItems(newFoodItems)

    // Notify parent component if needed
    if (onFoodItemsChange) {
      onFoodItemsChange(newFoodItems)
    }
  }

  // Handle adding a new food item
  const handleAddNewItem = () => {
    setIsNewItem(true)
    setCurrentFoodItem(null)
    setEditingIndex(null)

    // Reset form
    form.reset({
      name: "",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    })

    setIsDialogOpen(true)
  }

  // Handle form submission
  const onSubmit = (values: FoodItemFormValues) => {
    const updatedFoodItem: FoodItem = {
      ...values,
      detectedViaAi: isNewItem
        ? false
        : currentFoodItem?.detectedViaAi || false,
      imageUrl: currentFoodItem?.imageUrl
    }

    let newFoodItems: FoodItem[]

    if (isNewItem) {
      // Add new item
      newFoodItems = [...foodItems, updatedFoodItem]
    } else if (editingIndex !== null) {
      // Update existing item
      newFoodItems = [...foodItems]
      newFoodItems[editingIndex] = updatedFoodItem
    } else {
      newFoodItems = foodItems
    }

    setFoodItems(newFoodItems)
    setIsDialogOpen(false)

    // Notify parent component if needed
    if (onFoodItemsChange) {
      onFoodItemsChange(newFoodItems)
    }
  }

  // Handle updating the food item with quantity changes
  const handleQuantityChange = (updatedItem: FoodItem, index: number) => {
    const newFoodItems = [...foodItems]
    newFoodItems[index] = updatedItem
    setFoodItems(newFoodItems)

    // Notify parent component if needed
    if (onFoodItemsChange) {
      onFoodItemsChange(newFoodItems)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Nutrition summary card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nutrition Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-muted-foreground text-sm">Calories</div>
              <div className="font-medium">
                {nutritionTotals.calories.toFixed(0)} kcal
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground text-sm">Protein</div>
              <div className="font-medium">
                {nutritionTotals.protein.toFixed(1)}g
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground text-sm">Carbs</div>
              <div className="font-medium">
                {nutritionTotals.carbs.toFixed(1)}g
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground text-sm">Fat</div>
              <div className="font-medium">
                {nutritionTotals.fat.toFixed(1)}g
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Food items list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">
            Food Items ({foodItems.length})
          </h3>
          {!readOnly && (
            <Button
              onClick={handleAddNewItem}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <PlusCircle className="size-4" />
              <span>Add Item</span>
            </Button>
          )}
        </div>

        {foodItems.length === 0 ? (
          <div className="text-muted-foreground flex h-32 flex-col items-center justify-center rounded-md border border-dashed p-4 text-center">
            <p>No food items detected or added yet.</p>
            {!readOnly && (
              <Button
                onClick={handleAddNewItem}
                variant="ghost"
                className="mt-2"
              >
                Add manually
              </Button>
            )}
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {foodItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <FoodCard
                  food={item}
                  onEdit={!readOnly ? () => handleEdit(item, index) : undefined}
                  onDelete={!readOnly ? () => handleDelete(index) : undefined}
                  onQuantityChange={
                    !readOnly
                      ? updatedItem => handleQuantityChange(updatedItem, index)
                      : undefined
                  }
                  readOnly={readOnly}
                  className="mb-2"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Save meal button (only shown if there are items and not in read-only mode) */}
      {!readOnly && foodItems.length > 0 && onSaveMeal && (
        <div className="flex justify-end">
          <Button onClick={onSaveMeal}>Save Meal</Button>
        </div>
      )}

      {/* Edit/Add food item dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isNewItem ? "Add Food Item" : "Edit Food Item"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Food Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Apple" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="calories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calories (kcal)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="protein"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Protein (g)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="carbs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carbs (g)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fat (g)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="submit">
                  {isNewItem ? "Add Item" : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
