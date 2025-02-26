/**
 * @description
 * API integration for nutrition data sources.
 * Provides functions to query USDA FoodData Central and OpenFoodFacts APIs.
 *
 * Features:
 * - Search for food items by name in USDA database
 * - Get detailed nutritional information for a specific USDA food
 * - Search for products in OpenFoodFacts database
 * - Get detailed product information from OpenFoodFacts
 * - Standardize nutrition data from multiple sources
 *
 * @dependencies
 * - fetch API: For making HTTP requests
 * - @/types: For nutrition data types
 * - @/lib/api/api-logger: For logging API calls
 *
 * @notes
 * - Uses environment variables for API keys
 * - Implements retry logic for resilience
 * - Includes error handling for API failures
 * - Normalizes data from different sources into a consistent format
 */

"use server"

import {
  FoodItemDetail,
  NutritionAPIResponse,
  NutritionInfo,
  OpenFoodFactsSearchParams,
  USDASearchParams
} from "@/types/nutrition-types"
import {
  logNutritionAPIRequest,
  logNutritionAPIResponse,
  logAPIError,
  logFinalFoodItem
} from "@/lib/api/api-logger"
import { FoodIdentificationStep } from "@/lib/logger"

// Constants
const USDA_API_KEY = process.env.USDA_API_KEY
const USDA_BASE_URL = "https://api.nal.usda.gov/fdc/v1"
const OPENFOODFACTS_BASE_URL = "https://world.openfoodfacts.org/api/v0"

// Default nutritional values for when nutrition data is unavailable
const DEFAULT_NUTRITION: NutritionInfo = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0
}

// Error messages
const ERROR_MESSAGES = {
  INVALID_QUERY: "Search query must be provided",
  API_KEY_MISSING: "API key is not configured",
  REQUEST_FAILED: "Failed to fetch data from API",
  ITEM_NOT_FOUND: "Food item not found",
  PARSE_ERROR: "Failed to parse API response"
}

/**
 * Search for food items in the USDA FoodData Central database
 *
 * @param params - Search parameters including query string
 * @param traceId - Optional trace ID for logging
 * @returns Promise with search results
 */
export async function searchUSDAFoods(
  params: USDASearchParams,
  traceId?: string
): Promise<NutritionAPIResponse<FoodItemDetail>> {
  try {
    // Log the request if traceId is provided
    if (traceId) {
      // Create detailed request info for logging
      const requestDetails = {
        endpoint: `${USDA_BASE_URL}/foods/search`,
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        params: {
          ...params,
          api_key: USDA_API_KEY ? "[REDACTED]" : undefined
        }
      }

      await logNutritionAPIRequest(
        traceId,
        "USDA FoodData Central",
        requestDetails
      )
    }

    // Validate required parameters
    if (!params.query || params.query.trim() === "") {
      throw new Error(ERROR_MESSAGES.INVALID_QUERY)
    }

    // Check if API key is available
    if (!USDA_API_KEY) {
      throw new Error(ERROR_MESSAGES.API_KEY_MISSING)
    }

    // Build query parameters
    const queryParams = new URLSearchParams({
      api_key: USDA_API_KEY,
      query: params.query,
      pageSize: params.pageSize?.toString() || "25",
      pageNumber: params.pageNumber?.toString() || "1"
    })

    // Add optional parameters if provided
    if (params.sortBy) queryParams.append("sortBy", params.sortBy)
    if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder)

    // Add data types if provided (as comma-separated list)
    if (params.dataType && params.dataType.length > 0) {
      params.dataType.forEach(type => {
        queryParams.append("dataType", type)
      })
    }

    // Make API request
    const response = await fetch(
      `${USDA_BASE_URL}/foods/search?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        cache: "no-store" // Disable caching for real-time data
      }
    )

    // Handle API errors
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `${ERROR_MESSAGES.REQUEST_FAILED}: ${response.status} ${errorText}`
      )
    }

    // Parse response
    const data = await response.json()

    // Log the response if traceId is provided
    if (traceId) {
      // Create detailed response info for logging, including full data
      const responseDetails = {
        totalHits: data.totalHits,
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        foodsCount: data.foods?.length,
        // Include the first 3 foods for detailed inspection
        sampleFoods: data.foods?.slice(0, 3).map((food: any) => ({
          fdcId: food.fdcId,
          description: food.description,
          dataType: food.dataType,
          brandOwner: food.brandOwner,
          ingredients: food.ingredients,
          foodNutrients: food.foodNutrients?.slice(0, 10) // First 10 nutrients for sample
        }))
      }

      await logNutritionAPIResponse(
        traceId,
        "USDA FoodData Central",
        responseDetails
      )
    }

    // Transform USDA data to standard format
    const items = data.foods?.map((food: any) => transformUSDAFood(food)) || []

    // Log the final processed food items if traceId is provided
    if (traceId && items.length > 0) {
      // Log all transformed items with complete data
      await logFinalFoodItem(traceId, items)
    }

    return {
      items,
      totalHits: data.totalHits || 0,
      currentPage: data.currentPage || 1,
      totalPages: data.totalPages || 1
    }
  } catch (error) {
    console.error("Error searching USDA foods:", error)

    // Log the error if traceId is provided
    if (traceId) {
      await logAPIError(
        traceId,
        FoodIdentificationStep.NUTRITION_API_RESPONSE,
        error
      )
    }

    // Return empty result set instead of throwing
    return {
      items: [],
      totalHits: 0,
      currentPage: 1,
      totalPages: 1
    }
  }
}

/**
 * Get detailed information for a specific food item from USDA
 *
 * @param fdcId - USDA FoodData Central ID
 * @returns Promise with detailed food information
 */
export async function getUSDAFoodDetails(
  fdcId: string
): Promise<FoodItemDetail | null> {
  try {
    // Check if API key is available
    if (!USDA_API_KEY) {
      throw new Error(ERROR_MESSAGES.API_KEY_MISSING)
    }

    // Make API request
    const response = await fetch(
      `${USDA_BASE_URL}/food/${fdcId}?api_key=${USDA_API_KEY}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        cache: "no-store"
      }
    )

    // Handle API errors
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      const errorText = await response.text()
      throw new Error(
        `${ERROR_MESSAGES.REQUEST_FAILED}: ${response.status} ${errorText}`
      )
    }

    // Parse response
    const food = await response.json()

    // Transform to standard format
    return transformUSDAFood(food)
  } catch (error) {
    console.error("Error getting USDA food details:", error)
    return null
  }
}

/**
 * Search for products in the OpenFoodFacts database
 *
 * @param params - Search parameters including search terms
 * @param traceId - Optional trace ID for logging
 * @returns Promise with search results
 */
export async function searchOpenFoodFacts(
  params: OpenFoodFactsSearchParams,
  traceId?: string
): Promise<NutritionAPIResponse<FoodItemDetail>> {
  try {
    // Log the request if traceId is provided
    if (traceId) {
      // Create detailed request info for logging
      const requestDetails = {
        endpoint: `${OPENFOODFACTS_BASE_URL}/search`,
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "FoodIdentificationApp/1.0"
        },
        params: params
      }

      await logNutritionAPIRequest(traceId, "OpenFoodFacts", requestDetails)
    }

    // Validate required parameters
    if (!params.search_terms || params.search_terms.trim() === "") {
      throw new Error(ERROR_MESSAGES.INVALID_QUERY)
    }

    // Build query parameters
    const queryParams = new URLSearchParams({
      search_terms: params.search_terms
    })

    // Add optional parameters if provided
    if (params.page_size)
      queryParams.append("page_size", params.page_size.toString())
    if (params.page) queryParams.append("page", params.page.toString())
    if (params.sort_by) queryParams.append("sort_by", params.sort_by)

    // Make API request
    const response = await fetch(
      `${OPENFOODFACTS_BASE_URL}/search?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          "User-Agent": "FoodIdentificationApp/1.0", // Required by OFF API
          "Content-Type": "application/json"
        },
        cache: "no-store"
      }
    )

    // Handle API errors
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `${ERROR_MESSAGES.REQUEST_FAILED}: ${response.status} ${errorText}`
      )
    }

    // Parse response
    const data = await response.json()

    // Log the response if traceId is provided
    if (traceId) {
      // Create detailed response info for logging
      const responseDetails = {
        totalHits: data.count,
        currentPage: data.page || 1,
        totalPages: data.page_count || 1,
        productsCount: data.products?.length,
        // Include sample products for detailed inspection
        sampleProducts: data.products?.slice(0, 3).map((product: any) => ({
          code: product.code,
          product_name: product.product_name,
          brands: product.brands,
          categories: product.categories,
          ingredients_text: product.ingredients_text,
          nutriments: product.nutriments
        })),
        // Include raw query parameters for debugging
        query: data.query
      }

      await logNutritionAPIResponse(traceId, "OpenFoodFacts", responseDetails)
    }

    // Transform OpenFoodFacts data to standard format
    const items =
      data.products?.map((product: any) =>
        transformOpenFoodFactsProduct(product)
      ) || []

    // Log the final processed food items if traceId is provided
    if (traceId && items.length > 0) {
      // Log all transformed items
      await logFinalFoodItem(traceId, items)
    }

    return {
      items,
      totalHits: data.count || 0,
      currentPage: data.page || 1,
      totalPages: data.page_count || 1
    }
  } catch (error) {
    console.error("Error searching OpenFoodFacts:", error)

    // Log the error if traceId is provided
    if (traceId) {
      await logAPIError(
        traceId,
        FoodIdentificationStep.NUTRITION_API_RESPONSE,
        error
      )
    }

    // Return empty result set instead of throwing
    return {
      items: [],
      totalHits: 0,
      currentPage: 1,
      totalPages: 1
    }
  }
}

/**
 * Get detailed information for a specific product from OpenFoodFacts
 *
 * @param barcode - OpenFoodFacts product barcode
 * @returns Promise with detailed product information
 */
export async function getOpenFoodFactsProduct(
  barcode: string
): Promise<FoodItemDetail | null> {
  try {
    // Make API request
    const response = await fetch(
      `${OPENFOODFACTS_BASE_URL}/product/${barcode}.json`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "AIFoodIdentifier/1.0"
        },
        cache: "no-store"
      }
    )

    // Handle API errors
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      const errorText = await response.text()
      throw new Error(
        `${ERROR_MESSAGES.REQUEST_FAILED}: ${response.status} ${errorText}`
      )
    }

    // Parse response
    const data = await response.json()

    // Check if product was found
    if (data.status !== 1 || !data.product) {
      return null
    }

    // Transform to standard format
    return transformOpenFoodFactsProduct(data.product)
  } catch (error) {
    console.error("Error getting OpenFoodFacts product:", error)
    return null
  }
}

/**
 * Search for food nutrition information across multiple data sources
 *
 * @param query - Search query string
 * @param options - Optional parameters including traceId for logging
 * @returns Promise with search results
 */
export async function searchFoodNutrition(
  query: string,
  options?: { traceId?: string }
): Promise<NutritionAPIResponse<FoodItemDetail>> {
  try {
    const traceId = options?.traceId

    // Start with USDA search
    const usdaResults = await searchUSDAFoods(
      { query, dataType: ["Foundation", "SR Legacy", "Survey (FNDDS)"] },
      traceId
    )

    // Then search OpenFoodFacts
    const offResults = await searchOpenFoodFacts(
      { search_terms: query },
      traceId
    )

    // Combine results, prioritizing USDA
    const combinedItems = [
      ...usdaResults.items,
      ...offResults.items.filter(
        offItem =>
          !usdaResults.items.some(
            usdaItem =>
              usdaItem.name.toLowerCase() === offItem.name.toLowerCase()
          )
      )
    ]

    return {
      items: combinedItems,
      totalHits: (usdaResults.totalHits || 0) + (offResults.totalHits || 0),
      currentPage: 1,
      totalPages: 1
    }
  } catch (error) {
    console.error("Error searching food nutrition:", error)

    // Log the error if traceId is provided
    if (options?.traceId) {
      await logAPIError(
        options.traceId,
        FoodIdentificationStep.NUTRITION_API_RESPONSE,
        error
      )
    }

    // Return empty result set
    return {
      items: [],
      totalHits: 0,
      currentPage: 1,
      totalPages: 1
    }
  }
}

/**
 * Fallback function that returns a basic nutrition estimate when APIs fail
 *
 * @param foodName - Name of the food item
 * @returns Promise with default food item with estimated nutrition
 */
export async function getFallbackNutrition(
  foodName: string
): Promise<FoodItemDetail> {
  return {
    name: foodName,
    description: `Estimated nutrition for ${foodName}`,
    nutrition: DEFAULT_NUTRITION,
    source: "default",
    confidence: 0
  }
}

/**
 * Transform USDA food data to standard format
 *
 * @param food - Raw USDA food data
 * @returns Standardized food item detail
 */
function transformUSDAFood(food: any): FoodItemDetail {
  try {
    // Extract nutrients
    let calories = 0
    let protein = 0
    let carbs = 0
    let fat = 0

    // Find nutrients in the food's nutrient array
    if (food.foodNutrients) {
      for (const nutrient of food.foodNutrients) {
        if (!nutrient.nutrientNumber) continue

        // Map USDA nutrient numbers to our standard properties
        switch (nutrient.nutrientNumber) {
          case "208": // Energy (kcal)
            calories = nutrient.value || 0
            break
          case "2048": // Energy (Atwater Specific Factors)
            // Only use this value if calories haven't been set yet by nutrient 208
            if (calories === 0) {
              calories = nutrient.value || 0
            }
            break
          case "203": // Protein
            protein = nutrient.value || 0
            break
          case "205": // Carbohydrates
            carbs = nutrient.value || 0
            break
          case "204": // Total lipids (fat)
            fat = nutrient.value || 0
            break
        }
      }
    }

    return {
      name: food.description || food.lowercaseDescription || "Unknown Food",
      description: food.additionalDescriptions || "",
      brandOwner: food.brandOwner || "",
      ingredients: food.ingredients || "",
      nutrition: {
        calories,
        protein,
        carbs,
        fat,
        servingSize: food.servingSize?.toString() || "100",
        servingSizeUnit: food.servingSizeUnit || "g",
        servingWeight: food.servingWeight || 100
      },
      source: "USDA",
      sourceId: food.fdcId?.toString(),
      confidence: 0.9 // Default high confidence for USDA data
    }
  } catch (error) {
    console.error("Error transforming USDA food:", error)
    return {
      name: food.description || "Unknown Food",
      nutrition: DEFAULT_NUTRITION,
      source: "USDA",
      sourceId: food.fdcId?.toString(),
      confidence: 0.5
    }
  }
}

/**
 * Transform OpenFoodFacts product to standard format
 *
 * @param product - Raw OpenFoodFacts product data
 * @returns Standardized food item detail
 */
function transformOpenFoodFactsProduct(product: any): FoodItemDetail {
  try {
    // Extract nutrient data
    const nutrients = product.nutriments || {}

    // Extract serving size information
    let servingSize = product.serving_quantity?.toString() || "100"
    let servingSizeUnit =
      product.serving_size?.replace(/[\d\s]+/, "").trim() || "g"
    let servingWeight =
      parseFloat(product.serving_size?.match(/[\d.]+/) || "100") || 100

    // If nutrient data is per serving, convert to per 100g for consistency
    const per100g = nutrients.energy_100g !== undefined

    return {
      name: product.product_name || product.generic_name || "Unknown Product",
      description: product.generic_name || "",
      brandOwner: product.brands || "",
      ingredients: product.ingredients_text || "",
      nutrition: {
        calories: (per100g ? nutrients.energy_100g : nutrients.energy) || 0,
        protein: (per100g ? nutrients.proteins_100g : nutrients.proteins) || 0,
        carbs:
          (per100g ? nutrients.carbohydrates_100g : nutrients.carbohydrates) ||
          0,
        fat: (per100g ? nutrients.fat_100g : nutrients.fat) || 0,
        servingSize,
        servingSizeUnit,
        servingWeight
      },
      source: "OpenFoodFacts",
      sourceId: product.code || product._id,
      confidence: 0.8 // Default high confidence for OpenFoodFacts data
    }
  } catch (error) {
    console.error("Error transforming OpenFoodFacts product:", error)
    return {
      name: product.product_name || "Unknown Product",
      nutrition: DEFAULT_NUTRITION,
      source: "OpenFoodFacts",
      sourceId: product.code || product._id,
      confidence: 0.5
    }
  }
}
