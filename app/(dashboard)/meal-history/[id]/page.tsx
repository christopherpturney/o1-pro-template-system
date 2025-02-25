"use server"

/**
 * @description
 * Meal detail page that displays comprehensive information about a specific meal.
 * Features:
 * - Meal metadata (date, time, total calories)
 * - List of all food items in the meal with nutritional details
 * - Nutritional breakdown charts
 * - Option to delete the meal
 *
 * @dependencies
 * - getMealsByUserIdAction: To fetch the specific meal
 * - getFoodItemsByMealIdAction: To fetch food items for the meal
 * - Clerk auth: For user authentication
 * - FoodItemList: For displaying food items with nutrition info
 */

import { auth } from "@clerk/nextjs/server"
import { getMealsByUserIdAction } from "@/actions/db/meals-actions"
import { getFoodItemsByMealIdAction } from "@/actions/db/food-items-actions"
import { Suspense } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { FoodItemList } from "@/components/food-item-list"
import { FoodItem } from "@/components/ui/food-card"
import { CalendarClock, ArrowLeft, Trash } from "lucide-react"
import Link from "next/link"

interface MealDetailProps {
  params: Promise<{ id: string }>
}

export default async function MealDetailPage({ params }: MealDetailProps) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/meal-history">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 size-4" />
            Back to Meal History
          </Button>
        </Link>
      </div>

      <Suspense fallback={<MealDetailSkeleton />}>
        <MealDetail mealId={id} />
      </Suspense>
    </div>
  )
}

// Component to fetch and display the meal detail
async function MealDetail({ mealId }: { mealId: string }) {
  const { userId } = await auth()

  if (!userId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p>You need to be logged in to view this meal.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Fetch meal data
  const mealsResponse = await getMealsByUserIdAction(userId)

  if (!mealsResponse.isSuccess) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p>Failed to load meal: {mealsResponse.message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Find the specific meal
  const meal = mealsResponse.data.find(m => m.id === mealId)

  if (!meal) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p>Meal not found or you don't have permission to view it.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Fetch food items for this meal
  const foodItemsResponse = await getFoodItemsByMealIdAction(mealId)

  if (!foodItemsResponse.isSuccess) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p>Failed to load food items: {foodItemsResponse.message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Convert database food items to the FoodItem interface expected by the component
  const foodItems: FoodItem[] = foodItemsResponse.data.map(item => ({
    name: item.name,
    // Convert numeric strings to numbers with parseFloat
    calories: parseFloat(item.calories?.toString() || "0"),
    protein: parseFloat(item.protein?.toString() || "0"),
    carbs: parseFloat(item.carbs?.toString() || "0"),
    fat: parseFloat(item.fat?.toString() || "0"),
    detectedViaAI: item.detectedViaAi || false,
    confidence: item.confidence
      ? parseFloat(item.confidence.toString())
      : undefined,
    source: item.source as "USDA" | "OpenFoodFacts" | "default" | undefined,
    sourceId: item.sourceId || undefined
  }))

  const formattedDate = format(
    new Date(meal.mealDate),
    "MMMM d, yyyy 'at' h:mm a"
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Meal Details</CardTitle>
              <CardDescription className="mt-1 flex items-center gap-2">
                <CalendarClock className="size-4" />
                {formattedDate}
              </CardDescription>
            </div>
            {/* Actions could be added here in the future */}
          </div>
        </CardHeader>
        <CardContent>
          <FoodItemList initialFoodItems={foodItems} readOnly={true} />
        </CardContent>
      </Card>
    </div>
  )
}

// Loading skeleton for the meal detail
function MealDetailSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-7 w-40 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-full animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-24 w-full animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-16 w-full animate-pulse rounded-md bg-gray-200 dark:bg-gray-700"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
