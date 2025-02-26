/**
 * @description
 * Server actions for nutrition data lookup.
 * These actions handle the retrieval of nutritional information for food items
 * from external APIs (USDA FoodData Central and OpenFoodFacts).
 * 
 * Features:
 * - Lookup nutrition info by food name
 * - Retrieve detailed nutrition data for a specific food item
 * - Batch processing for multiple food items
 * - Fallback to default values when APIs fail
 * 
 * @dependencies
 * - @/types: For ActionState and nutrition types
 * - @/lib/api/nutrition-api: For API integration functions
 * - @clerk/nextjs/server: For authentication
 * 
 * @notes
 * - All requests are authenticated to prevent abuse
 * - Implements caching strategies for frequent requests
 * - Handles API failures gracefully with fallbacks
 * - Returns standardized nutrition data format
 */

"use server"

import { auth } from "@clerk/nextjs/server"
import { ActionState } from "@/types"
import { FoodItemDetail, NutritionAPIResponse } from "@/types"
import {
  getFallbackNutrition,
  getOpenFoodFactsProduct,
  getUSDAFoodDetails,
  searchFoodNutrition
} from "@/lib/api/nutrition-api"

/**
 * Lookup nutritional information for a food item by name
 * 
 * @param foodName - Name of the food item to lookup
 * @param traceId - Optional trace ID for logging
 * @returns Promise with nutritional information
 */
export async function getNutritionInfoAction(
  foodName: string,
  traceId?: string
): Promise<ActionState<FoodItemDetail[]>> {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.userId) {
      return { isSuccess: false, message: "Unauthorized" }
    }

    // Validate input
    if (!foodName || foodName.trim() === "") {
      return {
        isSuccess: false,
        message: "Food name is required"
      }
    }

    // Perform nutrition search through external APIs with trace ID
    const results = await searchFoodNutrition(foodName, { traceId })

    // If no results, provide fallback
    if (results.items.length === 0) {
      return {
        isSuccess: true,
        message: "Using estimated nutrition (no exact match found)",
        data: [(await getFallbackNutrition(foodName))]
      }
    }

    return {
      isSuccess: true,
      message: `Found ${results.items.length} nutrition results`,
      data: results.items
    }
  } catch (error) {
    console.error("Error getting nutrition info:", error)
    
    // Provide fallback on error
    return {
      isSuccess: true, // Still return success with fallback data
      message: "Using estimated nutrition (error fetching data)",
      data: [(await getFallbackNutrition(foodName))]
    }
  }
}

/**
 * Get detailed nutritional information for a specific food item
 * 
 * @param source - Source database ('USDA' or 'OpenFoodFacts')
 * @param sourceId - ID of the food item in the source database
 * @param traceId - Optional trace ID for logging
 * @returns Promise with detailed nutritional information
 */
export async function getDetailedNutritionAction(
  source: string,
  sourceId: string,
  traceId?: string
): Promise<ActionState<FoodItemDetail | null>> {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.userId) {
      return { isSuccess: false, message: "Unauthorized" }
    }

    // Validate input
    if (!source || !sourceId) {
      return {
        isSuccess: false,
        message: "Source and sourceId are required"
      }
    }

    let foodItem: FoodItemDetail | null = null

    // Get detailed info based on the source
    if (source.toUpperCase() === 'USDA') {
      foodItem = await getUSDAFoodDetails(sourceId)
    } else if (source.toUpperCase() === 'OPENFOODFACTS') {
      foodItem = await getOpenFoodFactsProduct(sourceId)
    } else {
      return {
        isSuccess: false,
        message: "Invalid source. Must be 'USDA' or 'OpenFoodFacts'"
      }
    }

    // If no food item found, return error
    if (!foodItem) {
      return {
        isSuccess: false,
        message: "Food item not found"
      }
    }

    return {
      isSuccess: true,
      message: "Nutrition data retrieved successfully",
      data: foodItem
    }
  } catch (error) {
    console.error("Error getting detailed nutrition:", error)
    return {
      isSuccess: false,
      message: `Failed to retrieve detailed nutrition: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * Batch lookup nutritional information for multiple food items
 * 
 * @param foodNames - Array of food item names to lookup
 * @param traceId - Optional trace ID for logging
 * @returns Promise with nutritional information for each food item
 */
export async function batchNutritionLookupAction(
  foodNames: string[],
  traceId?: string
): Promise<ActionState<Record<string, FoodItemDetail>>> {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.userId) {
      return { isSuccess: false, message: "Unauthorized" }
    }

    // Validate input
    if (!Array.isArray(foodNames) || foodNames.length === 0) {
      return {
        isSuccess: false,
        message: "Food names array is required"
      }
    }

    // Process each food name and collect results
    const results: Record<string, FoodItemDetail> = {}
    
    // Use Promise.all for parallel processing
    await Promise.all(
      foodNames.map(async (name) => {
        try {
          const result = await getNutritionInfoAction(name, traceId)
          if (result.isSuccess && result.data.length > 0) {
            // Use the best match (first item)
            results[name] = result.data[0]
          } else {
            // Use fallback for this item
            results[name] = await getFallbackNutrition(name)
          }
        } catch (error) {
          console.error(`Error looking up nutrition for "${name}":`, error)
          results[name] = await getFallbackNutrition(name)
        }
      })
    )

    return {
      isSuccess: true,
      message: `Processed nutrition for ${foodNames.length} food items`,
      data: results
    }
  } catch (error) {
    console.error("Error in batch nutrition lookup:", error)
    return {
      isSuccess: false,
      message: `Failed to process nutrition batch: ${error instanceof Error ? error.message : String(error)}`
    }
  }
} 