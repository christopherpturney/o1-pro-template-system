"use client"

/**
 * @description
 * This client component manages the meal logging process in the AI Food Identifier & Nutrition Tracker app.
 * It allows users to:
 * - Upload an image of their meal
 * - View and manually adjust detected food items
 * - Fetch nutritional information for food items (placeholder until Step 27)
 * - Save the meal log with the associated food items and nutritional data
 *
 * Key features:
 * - Image Upload and Processing: Handles image selection, uploading, and AI-based food detection
 * - Food Item Management: Displays and allows editing of detected food items with nutritional data
 * - Meal Logging: Provides a form to select the meal date and save the meal log with calculated total calories
 *
 * @dependencies
 * - "@/components/image-upload": For selecting and uploading images
 * - "@/components/food-item-list": For displaying and editing food items
 * - "@/components/ui/button": For styled buttons
 * - "@/components/ui/form": For form handling with react-hook-form
 * - "@/components/ui/input": For input fields
 * - "@/actions/ai/image-processing-actions": For processing images to detect food items
 * - "@/actions/nutrition/nutrition-actions": For fetching nutritional information (placeholder)
 * - "@/actions/db/meals-actions": For creating meal logs
 * - "@/types": For TempFoodItem type definitions
 * - "@/lib/hooks/use-toast": For displaying toast notifications
 * - "@clerk/nextjs": For user authentication
 *
 * @notes
 * - Placeholder used for `uploadImageAction` as it is not yet implemented (expected in Step 19)
 * - `getNutritionInfoAction` is mocked; actual implementation will be added in Step 27
 * - Assumes server actions return data in the `ActionState` format: { isSuccess: boolean, data: any, message: string }
 * - Nutritional data is optional; total calories are calculated from available data
 * - Protected route under dashboard; assumes user is authenticated via Clerk middleware
 */

import { useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { ImageUpload } from "@/components/image-upload"
import { FoodItemList } from "@/components/food-item-list"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { processImageAction } from "@/actions/ai/image-processing-actions"
// import { getNutritionInfoAction } from "@/actions/nutrition/nutrition-actions" // Uncomment in Step 27
import { createMealAction } from "@/actions/db/meals-actions"
import { TempFoodItem } from "@/types"
import { useToast } from "@/lib/hooks/use-toast"
import { useUser } from "@clerk/nextjs"

// Define form schema for meal date
const formSchema = z.object({
  mealDate: z.date()
})

// Extend TempFoodItem with UI state for fetching status
type FoodItemState = TempFoodItem & { isFetching: boolean }

export default function MealLogPage() {
  // State for image and processing
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePath, setImagePath] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [foodItems, setFoodItems] = useState<FoodItemState[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const { toast } = useToast()
  const { user } = useUser()

  // Form setup with react-hook-form and Zod
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mealDate: new Date()
    }
  })

  // Handle image selection from ImageUpload component
  const handleImageSelect = (file: File) => {
    setImageFile(file)
  }

  // Handle image upload and processing
  const handleUploadAndProcess = async () => {
    if (!imageFile) return
    setIsUploading(true)

    // Placeholder for image upload action (to be implemented)
    // const uploadResult = await uploadImageAction(imageFile)
    const uploadResult = { isSuccess: true, data: { path: "path/to/image" } }

    if (uploadResult.isSuccess) {
      setImagePath(uploadResult.data.path)
      setIsProcessing(true)
      const processResult = await processImageAction(uploadResult.data.path)
      if (processResult.isSuccess) {
        // Map detected food items to TempFoodItem with UI state
        const detectedItems = processResult.data.foodItems.map(
          (name: string) => ({
            tempId: crypto.randomUUID(),
            name,
            detectedViaAi: true,
            isFetching: false
          })
        )
        setFoodItems(detectedItems)
      } else {
        toast({
          title: "Processing failed",
          description: processResult.message,
          variant: "destructive"
        })
      }
      setIsProcessing(false)
    } else {
      toast({
        title: "Upload failed",
        description: uploadResult.message,
        variant: "destructive"
      })
    }
    setIsUploading(false)
  }

  // Update a food item's fields
  const handleUpdateFoodItem = (
    tempId: string,
    updates: Partial<TempFoodItem>
  ) => {
    setFoodItems(prev =>
      prev.map(item =>
        item.tempId === tempId ? { ...item, ...updates } : item
      )
    )
  }

  // Fetch nutrition for a food item (mocked until Step 27)
  const handleFetchNutrition = async (tempId: string, name: string) => {
    setFoodItems(prev =>
      prev.map(item =>
        item.tempId === tempId ? { ...item, isFetching: true } : item
      )
    )

    // Placeholder for nutrition lookup (uncomment actual action in Step 27)
    // const result = await getNutritionInfoAction(name)
    const result = {
      isSuccess: true,
      data: { calories: 100, fat: 5, carbs: 20, protein: 10 }
    }

    if (result.isSuccess) {
      const { calories, fat, carbs, protein } = result.data
      handleUpdateFoodItem(tempId, { calories, fat, carbs, protein })
    } else {
      toast({
        title: "Failed to fetch nutrition",
        description: result.message,
        variant: "destructive"
      })
    }

    setFoodItems(prev =>
      prev.map(item =>
        item.tempId === tempId ? { ...item, isFetching: false } : item
      )
    )
  }

  // Delete a food item from the list
  const handleDeleteFoodItem = (tempId: string) => {
    setFoodItems(prev => prev.filter(item => item.tempId !== tempId))
  }

  // Save the meal log
  const handleSaveMealLog = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        title: "Authentication error",
        description: "User not authenticated.",
        variant: "destructive"
      })
      return
    }

    if (foodItems.length === 0) {
      toast({
        title: "No food items",
        description: "Please add at least one food item.",
        variant: "destructive"
      })
      return
    }

    setIsSaving(true)

    // Calculate total calories from food items with calorie data
    const totalCalories = foodItems
      .filter(item => item.calories !== undefined)
      .reduce((sum, item) => sum + (item.calories || 0), 0)

    // Prepare food items for database insertion
    const insertFoodItems = foodItems.map(item => ({
      name: item.name,
      calories: item.calories,
      fat: item.fat,
      carbs: item.carbs,
      protein: item.protein,
      detectedViaAi: item.detectedViaAi
    }))

    // Save meal log via server action
    const result = await createMealAction({
      userId: user.id,
      mealDate: values.mealDate,
      totalCalories,
      foodItems: insertFoodItems
    })

    if (result.isSuccess) {
      toast({ title: "Meal logged successfully" })
      // Reset state and form
      setFoodItems([])
      setImageFile(null)
      setImagePath(null)
      form.reset()
    } else {
      toast({
        title: "Failed to log meal",
        description: result.message,
        variant: "destructive"
      })
    }

    setIsSaving(false)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">Log a Meal</h1>

      {/* Image Upload Section */}
      <div className="mb-4">
        <ImageUpload onFileSelect={handleImageSelect} />
        <Button
          onClick={handleUploadAndProcess}
          disabled={!imageFile || isUploading || isProcessing}
          className="mt-2"
        >
          {isUploading
            ? "Uploading..."
            : isProcessing
              ? "Processing..."
              : "Upload and Process Image"}
        </Button>
      </div>

      {/* Food Items List */}
      {foodItems.length > 0 && (
        <div className="mb-4">
          <h2 className="mb-2 text-xl font-semibold">Detected Food Items</h2>
          <FoodItemList
            foodItems={foodItems}
            onUpdate={handleUpdateFoodItem}
            onFetchNutrition={handleFetchNutrition}
            onDelete={handleDeleteFoodItem}
          />
        </div>
      )}

      {/* Meal Log Form */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSaveMealLog)}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="mealDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meal Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={
                      field.value ? field.value.toISOString().split("T")[0] : ""
                    }
                    onChange={e =>
                      field.onChange(
                        e.target.value ? new Date(e.target.value) : null
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSaving || foodItems.length === 0}>
            {isSaving ? "Saving..." : "Save Meal Log"}
          </Button>
        </form>
      </Form>
    </div>
  )
}
