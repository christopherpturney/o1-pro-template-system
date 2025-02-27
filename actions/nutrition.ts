"use server"

import { searchFoodNutrition } from "@/lib/api/nutrition-api"
import { ActionState, FoodItemDetail } from "@/types"

/**
 * Server action to get nutrition information for a food item
 * @param foodName The name of the food to look up
 * @param traceId Optional trace ID for logging purposes
 */
export async function getNutritionInfoAction(
  foodName: string,
  traceId?: string
): Promise<ActionState<FoodItemDetail[]>> {
  try {
    if (!foodName) {
      return {
        isSuccess: false,
        message: "No food name provided"
      }
    }

    // Fetch nutrition data with the trace ID if provided
    const results = await searchFoodNutrition(foodName, { traceId })

    return {
      isSuccess: true,
      message: "Nutrition data retrieved successfully",
      data: results.items
    }
  } catch (error) {
    console.error(`Error getting nutrition for ${foodName}:`, error)
    return {
      isSuccess: false,
      message: "Failed to retrieve nutrition information"
    }
  }
}

/**
 * Server action to batch lookup nutrition information for multiple food items
 * @param foodNames Array of food names to look up
 * @param traceId Optional trace ID for logging purposes
 */
export async function batchNutritionLookupAction(
  foodNames: string[],
  traceId?: string
): Promise<ActionState<Record<string, FoodItemDetail>>> {
  try {
    if (!foodNames || foodNames.length === 0) {
      return {
        isSuccess: false,
        message: "No food names provided"
      }
    }

    // Create a map to store results by food name
    const nutritionMap: Record<string, FoodItemDetail> = {}

    // Process each food item in parallel
    await Promise.all(
      foodNames.map(async foodName => {
        try {
          // Fetch nutrition data with the trace ID if provided
          const results = await searchFoodNutrition(foodName, { traceId })
          if (results.items && results.items.length > 0) {
            // Store the best match in the map
            nutritionMap[foodName] = results.items[0]
          }
        } catch (error) {
          console.error(`Error in batch lookup for ${foodName}:`, error)
          // Continue with other lookups even if one fails
        }
      })
    )

    return {
      isSuccess: true,
      message: "Batch nutrition lookup completed",
      data: nutritionMap
    }
  } catch (error) {
    console.error("Error in batch nutrition lookup:", error)
    return {
      isSuccess: false,
      message: "Failed to complete batch nutrition lookup"
    }
  }
} 