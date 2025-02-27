// app/(dashboard)/meal-log/_components/meal-log-form.tsx
"use client"

/**
 * @description
 * This client component handles the complete meal logging workflow:
 * 1. Image capture/upload
 * 2. AI processing to detect food items
 * 3. Manual adjustment of detected items
 * 4. Saving the complete meal to the database
 *
 * Features:
 * - Multi-step wizard interface
 * - Image upload with preview
 * - AI-powered food detection
 * - Automatic nutrition lookup for detected foods
 * - Manual food item editing
 * - Error handling and loading states
 *
 * @dependencies
 * - ImageUpload: For capturing/uploading food images
 * - FoodItemList: For displaying and editing detected food items
 * - detectFoodInImageAction: Server action for AI image analysis
 * - getNutritionInfoAction: Server action for food nutrition lookup
 * - createMealAction: Server action for saving the meal to database
 * - createFoodItemAction: Server action for creating food items
 * - Lucide icons: For UI elements
 * - React hooks: For state management
 *
 * @notes
 * - Uses a step-based UI to guide users through the process
 * - Maintains all state in the client for a smooth UX
 * - Handles errors at each step with user-friendly messages
 * - Optimistic UI updates on save while the server action completes
 */

import { useCallback, useEffect, useState, useTransition } from "react"
import React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FoodItemList } from "@/components/food-item-list"
import ImageUpload from "@/components/image-upload"
import { FoodItem } from "@/components/ui/food-card"
import {
  useFoodIdentificationLogger,
  FoodIdentificationStep
} from "@/lib/food-logger"
import {
  LoaderIcon,
  RotateCcw,
  Loader2,
  ArrowRight,
  Camera,
  Calendar,
  CheckCircle
} from "lucide-react"
import { detectFoodInImageAction } from "@/actions/detect-food"
import { createMealAction } from "@/actions/db/meals-actions"
import { createFoodItemAction } from "@/actions/db/food-items-actions"
import {
  getNutritionInfoAction,
  batchNutritionLookupAction
} from "@/actions/nutrition/nutrition-actions"
import { useAuth } from "@clerk/nextjs"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

// Enum for the steps in the meal logging process
enum MealLogStep {
  Upload = 0,
  Review = 1,
  Complete = 2
}

// Extended FoodItem type to match both the DB schema and UI components
interface MealLogFoodItem {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  detectedViaAi?: boolean
  imageUrl?: string
  // Add source property to match what we're setting in the code
  source?: "USDA" | "OpenFoodFacts" | "default"
  sourceId?: string
  confidence?: number
}

export default function MealLogForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const { userId } = useAuth()
  const logger = useFoodIdentificationLogger()

  // State for managing the multi-step process
  const [currentStep, setCurrentStep] = useState<MealLogStep>(
    MealLogStep.Upload
  )

  // State for the uploaded image
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  // Base64 image data for server processing
  const [imageBase64, setImageBase64] = useState<string | null>(null)

  // State for meal information
  const [mealDate, setMealDate] = useState<string>(
    new Date().toISOString().slice(0, 16) // Current date and time in format "YYYY-MM-DDThh:mm"
  )

  // State for food items
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])

  // State for errors and processing
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  // New state for nutrition fetching
  const [isLoadingNutrition, setIsLoadingNutrition] = useState(false)

  // Convert File to base64 string
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  // Handle image upload - Fix the type to accept only one parameter
  const handleImageUpload = useCallback(
    (file: File) => {
      if (file) {
        setImageFile(file)
        // Generate preview URL from the file
        const previewUrl = URL.createObjectURL(file)
        setImagePreview(previewUrl)

        // Convert file to base64 for server processing
        fileToBase64(file)
          .then(base64String => {
            setImageBase64(base64String)
            setError(null)

            // Log the image upload
            logger.logImageUpload(file, base64String)
          })
          .catch(err => {
            console.error("Error converting image to base64:", err)
            setError("Failed to process the image. Please try again.")

            // Log the error
            logger.logError(FoodIdentificationStep.IMAGE_UPLOAD, err)
          })
      }
    },
    [logger]
  )

  // Handle food items changes
  const handleFoodItemsChange = useCallback((updatedItems: FoodItem[]) => {
    setFoodItems(updatedItems)
  }, [])

  // Fetch nutrition information for a single food item
  const fetchNutritionForFoodItem = useCallback(
    async (item: FoodItem, traceId?: string): Promise<FoodItem> => {
      try {
        // Return early if the item already has nutrition info
        if (
          item.calories > 0 ||
          item.protein > 0 ||
          item.carbs > 0 ||
          item.fat > 0
        ) {
          return item
        }

        // Pass the trace ID to the nutrition action
        const response = await getNutritionInfoAction(item.name, traceId)

        if (response.isSuccess && response.data.length > 0) {
          const nutritionData = response.data[0]

          return {
            ...item,
            calories: nutritionData.nutrition.calories || 0,
            protein: nutritionData.nutrition.protein || 0,
            carbs: nutritionData.nutrition.carbs || 0,
            fat: nutritionData.nutrition.fat || 0,
            // Store the source but don't display it in the UI directly
            source: nutritionData.source,
            sourceId: nutritionData.sourceId || undefined,
            description: nutritionData.description || undefined,
            confidence: item.confidence || nutritionData.confidence || 0
          }
        }

        return item
      } catch (error) {
        console.error(`Error fetching nutrition for ${item.name}:`, error)

        // Log the error
        logger.logError(FoodIdentificationStep.NUTRITION_API_RESPONSE, error)

        return item
      }
    },
    [logger]
  )

  // Process multiple food items in batch
  const processFoodItemsWithNutrition = useCallback(
    async (items: FoodItem[], traceId?: string): Promise<FoodItem[]> => {
      setIsLoadingNutrition(true)

      try {
        // Extract just the names for batch lookup
        const foodNames = items.map((item: FoodItem) => item.name)

        // Batch lookup nutrition information with trace ID
        const response = await batchNutritionLookupAction(foodNames, traceId)

        // Log nutrition API response
        logger.logNutritionAPIResponse(response)

        if (response.isSuccess) {
          // Update each food item with its nutrition information
          return items.map((item: FoodItem) => {
            const nutritionData = response.data[item.name]

            if (nutritionData) {
              return {
                ...item,
                calories: nutritionData.nutrition.calories || 0,
                protein: nutritionData.nutrition.protein || 0,
                carbs: nutritionData.nutrition.carbs || 0,
                fat: nutritionData.nutrition.fat || 0,
                // Store source data for linking to nutrition database
                source: nutritionData.source,
                sourceId: nutritionData.sourceId || undefined,
                description: nutritionData.description || undefined
              }
            }

            return item
          })
        }

        // If batch lookup fails, try each item individually
        const processedItems = await Promise.all(
          items.map((item: FoodItem) =>
            fetchNutritionForFoodItem(item, traceId)
          )
        )

        return processedItems
      } catch (error) {
        console.error("Error processing food items with nutrition:", error)

        // Log the error
        logger.logError(FoodIdentificationStep.NUTRITION_API_RESPONSE, error)

        return items
      } finally {
        setIsLoadingNutrition(false)
      }
    },
    [fetchNutritionForFoodItem, logger]
  )

  // Process the uploaded image using AI
  const processImage = useCallback(async () => {
    if (!imageFile || !imageBase64) {
      setError("Please upload an image first")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Log the OpenAI Vision request
      logger.logOpenAIVisionRequest(imageBase64)

      // Call the server action with base64 data and trace ID
      const result = await detectFoodInImageAction(imageBase64, logger.traceId)

      // Log the OpenAI Vision response
      logger.logOpenAIVisionResponse(result)

      if (!result.isSuccess) {
        setError(result.message || "Failed to process the image")
        return
      }

      // Safely access the response data
      if (!result.data || !result.data.foodItems) {
        setError("The response format was unexpected. Please try again.")

        // Log the error
        logger.logError(FoodIdentificationStep.OPENAI_VISION_RESPONSE, {
          message: "Unexpected response format",
          data: result
        })
        return
      }

      if (result.data.foodItems.length === 0) {
        setError(
          "No food items detected. Please try a clearer image or add items manually."
        )
        return
      }

      // Transform the detected food items to match our FoodItem interface
      // @ts-ignore: Ignore item type for now
      const detectedItems: FoodItem[] = result.data.foodItems.map(item => ({
        name: item.name,
        calories: 0, // Will be populated by nutrition lookup
        protein: 0,
        carbs: 0,
        fat: 0,
        detectedViaAi: true,
        confidence: item.confidence
      }))

      // Log nutrition API request
      logger.logNutritionAPIRequest(detectedItems)

      // Fetch nutritional information for the detected food items with trace ID
      const itemsWithNutrition = await processFoodItemsWithNutrition(
        detectedItems,
        logger.traceId
      )

      // Log the final food items
      logger.logFinalFoodItem(itemsWithNutrition)

      // Update state with the processed items
      setFoodItems(itemsWithNutrition)
      setCurrentStep(MealLogStep.Review)
    } catch (error) {
      console.error("Error processing image:", error)

      // More detailed error handling based on error type
      let errorMessage =
        "An unexpected error occurred while processing the image. Please try again."

      if (error instanceof Error) {
        // Extract more specific error information if available
        if (
          error.message.includes("fetch") ||
          error.message.includes("network")
        ) {
          errorMessage =
            "Network error: Please check your internet connection and try again."
        } else if (error.message.includes("timeout")) {
          errorMessage =
            "The request timed out. Please try again with a smaller image or check your connection."
        } else if (
          error.message.includes("parse") ||
          error.message.includes("JSON")
        ) {
          errorMessage =
            "Error parsing the response from the image processing service. Please try again."
        }
      }

      setError(errorMessage)

      // Log the error
      logger.logError(FoodIdentificationStep.OPENAI_VISION_RESPONSE, error)
    } finally {
      setIsProcessing(false)
    }
  }, [imageFile, imageBase64, processFoodItemsWithNutrition, logger])

  // Save the meal to the database
  const saveMeal = useCallback(() => {
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to save meals",
        variant: "destructive"
      })
      return
    }

    if (foodItems.length === 0) {
      setError("Please add at least one food item")
      return
    }

    // Calculate total calories for the meal
    const totalCalories = foodItems.reduce(
      (sum, item) => sum + (item.calories || 0),
      0
    )

    startTransition(async () => {
      try {
        // Create the meal in the database - we'll need to adapt this to match the expected parameters
        const result = await createMealAction({
          userId,
          mealDate: new Date(mealDate),
          totalCalories
          // Note: we're not passing foodItems here as it's not part of the InsertMeal type
          // The server action needs to handle creating the associated food items separately
        })

        if (!result.isSuccess) {
          toast({
            title: "Error",
            description: result.message || "Failed to save meal",
            variant: "destructive"
          })
          return
        }

        // Now create all the food items associated with this meal
        for (const item of foodItems) {
          await createFoodItemAction({
            mealId: result.data.id,
            name: item.name,
            // Convert number values to strings if the database schema expects strings
            calories: item.calories?.toString() || "0",
            protein: item.protein?.toString() || "0",
            carbs: item.carbs?.toString() || "0",
            fat: item.fat?.toString() || "0",
            detectedViaAi: item.detectedViaAi || false,
            // Handle confidence as a string or null
            confidence: item.confidence?.toString() || null,
            source: item.source,
            sourceId: item.sourceId
          })
        }

        // Display success message
        toast({
          title: "Success",
          description: "Meal logged successfully!",
          variant: "default"
        })

        // Move to the completion step
        setCurrentStep(MealLogStep.Complete)

        // Refresh the page data
        router.refresh()
      } catch (err) {
        console.error("Error saving meal:", err)
        toast({
          title: "Error",
          description: "An unexpected error occurred while saving the meal.",
          variant: "destructive"
        })
      }
    })
  }, [foodItems, mealDate, router, toast, userId])

  // Reset the form to start over
  const resetForm = useCallback(() => {
    setImageFile(null)
    setImagePreview(null)
    setImageBase64(null)
    setFoodItems([])
    setError(null)
    setCurrentStep(MealLogStep.Upload)
    setMealDate(new Date().toISOString().slice(0, 16))
  }, [])

  // View meal history
  const viewMealHistory = useCallback(() => {
    router.push("/meal-history")
  }, [router])

  // Render the current step
  const renderStep = () => {
    switch (currentStep) {
      case MealLogStep.Upload:
        return (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-medium">Take a Photo</h3>
                      <p className="text-muted-foreground text-sm">
                        Take a photo of your meal or upload an existing image.
                      </p>
                    </div>

                    <Camera className="text-muted-foreground size-8" />
                  </div>

                  <div className="mt-4">
                    <ImageUpload
                      onImageSelected={handleImageUpload}
                      className="w-full"
                    />
                  </div>

                  {error && (
                    <p className="text-destructive mt-2 text-sm">{error}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="meal-date">Meal Date & Time</Label>
                <Input
                  id="meal-date"
                  type="datetime-local"
                  value={mealDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMealDate(e.target.value)
                  }
                  className="w-full max-w-xs"
                />
              </div>

              <div className="ml-auto flex items-center gap-2">
                <Button
                  onClick={processImage}
                  disabled={!imageFile || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Identify Food
                      <ArrowRight className="ml-2 size-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )

      case MealLogStep.Review:
        return (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-medium">Review Food Items</h3>
                      <p className="text-muted-foreground text-sm">
                        Review and adjust the detected food items as needed.
                      </p>
                    </div>

                    <Calendar className="text-muted-foreground size-8" />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Label>Meal Date & Time:</Label>
                    <span className="text-sm">
                      {new Date(mealDate).toLocaleString()}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentStep(MealLogStep.Upload)}
                      className="ml-auto"
                    >
                      Edit
                    </Button>
                  </div>

                  {imagePreview && (
                    <div className="mx-auto max-w-md overflow-hidden rounded-md border">
                      <Image
                        src={imagePreview}
                        alt="Food preview"
                        width={300}
                        height={200}
                        className="h-auto w-full object-cover"
                      />
                    </div>
                  )}

                  {isLoadingNutrition && (
                    <div className="my-4 flex justify-center">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="text-primary size-5 animate-spin" />
                        <span className="text-muted-foreground text-sm">
                          Fetching nutritional information...
                        </span>
                      </div>
                    </div>
                  )}

                  <FoodItemList
                    initialFoodItems={foodItems}
                    onFoodItemsChange={handleFoodItemsChange}
                    className="mt-4"
                  />

                  {error && (
                    <p className="text-destructive mt-2 text-sm">{error}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(MealLogStep.Upload)}
              >
                Back
              </Button>

              <Button
                onClick={saveMeal}
                disabled={foodItems.length === 0 || isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save Meal
                    <ArrowRight className="ml-2 size-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )

      case MealLogStep.Complete:
        return (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6 py-6 text-center">
                  <CheckCircle className="text-primary mx-auto size-12" />
                  <div className="space-y-2">
                    <h3 className="text-xl font-medium">Meal Logged!</h3>
                    <p className="text-muted-foreground">
                      Your meal has been successfully saved to your history.
                    </p>
                  </div>

                  <div className="border-t pt-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                      <Button
                        variant="outline"
                        onClick={resetForm}
                        className="gap-2"
                      >
                        <RotateCcw className="size-4" />
                        <span>Log Another Meal</span>
                      </Button>
                      <Button onClick={viewMealHistory} className="gap-2">
                        <Calendar className="size-4" />
                        <span>View Meal History</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return <div className="space-y-6">{renderStep()}</div>
}
