/**
 * @description
 * Type definitions for nutritional data from external APIs.
 *
 * Defines interfaces for:
 * - Nutritional information (macronutrients)
 * - Food item details from external APIs
 * - API response structures
 *
 * @dependencies
 * - None
 *
 * @notes
 * - All nutritional values use number type for consistency
 * - Some fields are optional as they may not be available from all sources
 */

/**
 * Core nutritional information for a food item
 */
export interface NutritionInfo {
  calories: number
  protein: number
  carbs: number
  fat: number
  servingSize?: string
  servingSizeUnit?: string
  servingWeight?: number // in grams
}

/**
 * Extended food item details with nutrition information
 */
export interface FoodItemDetail {
  name: string
  description?: string
  brandOwner?: string
  ingredients?: string
  nutrition: NutritionInfo
  source: "USDA" | "OpenFoodFacts" | "default"
  sourceId?: string // ID in the original database
  confidence?: number // Confidence score for AI matching (0-1)
}

/**
 * API search parameters for USDA FoodData Central
 */
export interface USDASearchParams {
  query: string
  dataType?: string[] // e.g., ['Foundation', 'SR Legacy', 'Survey (FNDDS)', 'Branded']
  pageSize?: number
  pageNumber?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

/**
 * API search parameters for OpenFoodFacts
 */
export interface OpenFoodFactsSearchParams {
  search_terms: string
  page_size?: number
  page?: number
  sort_by?: string
}

/**
 * Generic API response structure for all nutrition APIs
 */
export interface NutritionAPIResponse<T> {
  items: T[]
  totalHits?: number
  currentPage?: number
  totalPages?: number
}

/**
 * Represents a detected food item from image processing
 */
export interface DetectedFoodItem {
  name: string
  confidence: number
}

/**
 * Result of processing an image with AI
 */
export interface ImageProcessingResult {
  foodItems: DetectedFoodItem[]
  extractedText: string[]
}
