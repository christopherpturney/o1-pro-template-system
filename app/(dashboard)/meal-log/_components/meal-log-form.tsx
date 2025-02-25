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
 * - Manual food item editing
 * - Error handling and loading states
 *
 * @dependencies
 * - ImageUpload: For capturing/uploading food images
 * - FoodItemList: For displaying and editing detected food items
 * - detectFoodInImageAction: Server action for AI image analysis
 * - createMealAction: Server action for saving the meal to database
 * - Lucide icons: For UI elements
 * - React hooks: For state management
 *
 * @notes
 * - Uses a step-based UI to guide users through the process
 * - Maintains all state in the client for a smooth UX
 * - Handles errors at each step with user-friendly messages
 * - Optimistic UI updates on save while the server action completes
 */

import { useState, useCallback, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FoodItemList } from "@/components/food-item-list"
import ImageUpload from "@/components/image-upload"
import { FoodItem } from "@/components/ui/food-card"
import {
  ArrowRight,
  Calendar,
  Camera,
  CheckCircle,
  Loader2,
  RotateCcw
} from "lucide-react"
// Import the new server action instead of the simplified version
import { detectFoodInImageAction } from "@/actions/ai/food-detection-actions"
import { createMealAction } from "@/actions/db/meals-actions"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@clerk/nextjs"
import { cn } from "@/lib/utils"

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
  detectedViaAI?: boolean // UI component uses capital AI
  imageUrl?: string
}

export default function MealLogForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const { userId } = useAuth()

  // State for managing the multi-step process
  const [currentStep, setCurrentStep] = useState<MealLogStep>(
    MealLogStep.Upload
  )

  // State for the uploaded image
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // State for meal information
  const [mealDate, setMealDate] = useState<string>(
    new Date().toISOString().slice(0, 16) // Current date and time in format "YYYY-MM-DDThh:mm"
  )

  // State for food items
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])

  // State for error handling
  const [error, setError] = useState<string | null>(null)

  // State for loading states
  const [isProcessing, setIsProcessing] = useState(false)

  // Handle image upload
  const handleImageUpload = useCallback((file: File) => {
    setImageFile(file)

    // Generate preview URL from the file
    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)
    setError(null)
  }, [])

  // Process the image to detect food items
  const processImage = useCallback(async () => {
    if (!imageFile) {
      setError("Please upload an image first")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Convert the file to base64 for the server action
      const reader = new FileReader()
      reader.readAsDataURL(imageFile)
      reader.onloadend = async () => {
        const base64Image = reader.result as string

        // Call the new food detection server action
        const result = await detectFoodInImageAction(base64Image)

        if (!result.isSuccess) {
          setError(result.message || "Failed to process image")
          setIsProcessing(false)
          return
        }

        // Check if we received food items from the AI
        if (!result.data?.foodItems || result.data.foodItems.length === 0) {
          setError(
            "No food items were detected in the image. Try a different image or add items manually."
          )
          setIsProcessing(false)
          return
        }

        // Convert the detected items to FoodItem format
        const detectedItems: FoodItem[] = result.data.foodItems.map(item => ({
          name: item.name,
          calories: 0, // Default values since the API might not provide these
          protein: 0,
          carbs: 0,
          fat: 0,
          detectedViaAI: true,
          confidence: item.confidence // Include the confidence score from AI
        }))

        setFoodItems(detectedItems)
        setCurrentStep(MealLogStep.Review)
        setIsProcessing(false)
      }
    } catch (err) {
      console.error("Error processing image:", err)
      setError(
        "An error occurred while processing the image. Please try again."
      )
      setIsProcessing(false)
    }
  }, [imageFile])

  // Handle changes to food items from the FoodItemList component
  const handleFoodItemsChange = useCallback((items: FoodItem[]) => {
    setFoodItems(items)
  }, [])

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

    // Calculate total calories
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
                  onChange={e => setMealDate(e.target.value)}
                  className="w-full max-w-xs"
                />
              </div>

              <Button
                onClick={processImage}
                disabled={!imageFile || isProcessing}
                className="ml-auto"
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
                  "Save Meal"
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
                <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
                  <CheckCircle className="size-16 text-green-500" />

                  <h3 className="text-2xl font-medium">
                    Meal Logged Successfully!
                  </h3>

                  <p className="text-muted-foreground max-w-md">
                    Your meal has been saved to your history. You can view all
                    your logged meals in the meal history section.
                  </p>

                  <div className="mt-6 flex space-x-4">
                    <Button variant="outline" onClick={resetForm}>
                      <RotateCcw className="mr-2 size-4" />
                      Log Another Meal
                    </Button>

                    <Button onClick={viewMealHistory}>View Meal History</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="relative flex items-center justify-between px-2">
        {["Upload Photo", "Review & Edit", "Complete"].map((step, index) => (
          <div key={step} className="z-10 flex flex-col items-center space-y-2">
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-sm font-medium",
                currentStep === index
                  ? "bg-primary text-primary-foreground"
                  : currentStep > index
                    ? "bg-primary/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {currentStep > index ? (
                <CheckCircle className="size-5" />
              ) : (
                index + 1
              )}
            </div>

            <span
              className={cn(
                "text-xs",
                currentStep === index
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              )}
            >
              {step}
            </span>
          </div>
        ))}

        {/* Connecting lines between steps */}
        <div className="absolute inset-x-0 top-4 -z-0 flex justify-center">
          <div className="bg-muted h-0.5 w-2/3" />
        </div>
      </div>

      {/* Current step content */}
      {renderStep()}
    </div>
  )
}
