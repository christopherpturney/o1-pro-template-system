"use client"

/**
 * @description
 * This client component displays a list of temporary food items for manual adjustment in the AI Food Identifier & Nutrition Tracker app.
 * It allows users to:
 * - Edit the name of each food item
 * - Fetch nutritional information for a food item based on its name
 * - Delete a food item from the list
 * - Manually input nutritional values if desired
 *
 * Key features:
 * - Controlled Inputs: Name and nutritional fields are controlled by parent state for seamless state management
 * - Callback Handlers: Provides callbacks for updating, fetching nutrition, and deleting items, delegating logic to the parent
 * - Responsive Design: Uses flex and grid layouts with Tailwind CSS for a mobile-friendly interface
 *
 * @dependencies
 * - "@/components/ui/button": For styled buttons (Fetch Nutrition, Delete)
 * - "@/components/ui/input": For styled input fields (name, nutritional values)
 * - "@/types": For TempFoodItem type definitions
 *
 * @notes
 * - Nutritional fields are optional and display empty when undefined; users can input values manually or fetch them
 * - Fetch Nutrition button triggers a callback for server-side nutrition lookup, avoiding direct API calls in the client component
 * - Delete button triggers a callback to remove the item, maintaining state consistency in the parent
 * - Uses tempId for unique identification of temporary items before they are saved to the database
 * - Input validation is minimal here; the parent component should handle sanitization and validation as needed
 */

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TempFoodItem } from "@/types"

// Define props interface for type safety
interface FoodItemListProps {
  foodItems: TempFoodItem[] // Array of temporary food items to display
  onUpdate: (tempId: string, updates: Partial<TempFoodItem>) => void // Callback to update a food item's fields
  onFetchNutrition: (tempId: string, name: string) => void // Callback to fetch nutrition data for a food item
  onDelete: (tempId: string) => void // Callback to delete a food item
}

/**
 * Renders a list of food items with editable fields and action buttons.
 *
 * @param {FoodItemListProps} props - Component props
 * @returns {JSX.Element} The rendered food item list
 */
export default function FoodItemList({
  foodItems,
  onUpdate,
  onFetchNutrition,
  onDelete
}: FoodItemListProps): JSX.Element {
  return (
    <div className="space-y-4">
      {/* Map through food items and render each as a separate block */}
      {foodItems.map(item => (
        <div key={item.tempId} className="space-y-2 rounded-md border p-4">
          {/* Name and action buttons row */}
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Food name"
              value={item.name}
              onChange={e => onUpdate(item.tempId, { name: e.target.value })}
              className="flex-1" // Ensures input takes available space
            />
            <Button onClick={() => onFetchNutrition(item.tempId, item.name)}>
              Fetch Nutrition
            </Button>
            <Button variant="destructive" onClick={() => onDelete(item.tempId)}>
              Delete
            </Button>
          </div>

          {/* Nutritional information inputs in a grid */}
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Calories"
              value={item.calories ?? ""} // Displays empty string if undefined
              onChange={e => {
                const value =
                  e.target.value === "" ? undefined : Number(e.target.value)
                onUpdate(item.tempId, { calories: value })
              }}
            />
            <Input
              type="number"
              placeholder="Fat (g)"
              value={item.fat ?? ""}
              onChange={e => {
                const value =
                  e.target.value === "" ? undefined : Number(e.target.value)
                onUpdate(item.tempId, { fat: value })
              }}
            />
            <Input
              type="number"
              placeholder="Carbs (g)"
              value={item.carbs ?? ""}
              onChange={e => {
                const value =
                  e.target.value === "" ? undefined : Number(e.target.value)
                onUpdate(item.tempId, { carbs: value })
              }}
            />
            <Input
              type="number"
              placeholder="Protein (g)"
              value={item.protein ?? ""}
              onChange={e => {
                const value =
                  e.target.value === "" ? undefined : Number(e.target.value)
                onUpdate(item.tempId, { protein: value })
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
