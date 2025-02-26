/**
 * @description
 * Server-side logging utility for API calls in the food identification process.
 * Intercepts and logs API calls for OpenAI Vision and nutrition data services.
 *
 * @dependencies
 * - None (pure utility)
 */

"use server"

import { FoodIdentificationStep } from "@/lib/logger"
import { addServerLog } from "@/lib/server-logger"

/**
 * Log an OpenAI Vision API request
 * @param traceId Trace ID for correlating logs
 * @param base64Image Base64 encoded image (will be truncated for logging)
 */
export async function logOpenAIVisionRequest(
  traceId: string,
  base64Image: string,
  prompt?: string,
  fullRequestParams?: any
) {
  // Create log entry
  const logEntry = {
    timestamp: new Date().toISOString(),
    traceId,
    step: FoodIdentificationStep.OPENAI_VISION_REQUEST,
    message: "OpenAI Vision API Request",
    data: {
      // Truncate the base64 image for logging purposes
      imageDataLength: base64Image?.length || 0,
      // Include the first 100 chars of the prompt if available
      promptPreview: prompt ? `${prompt.substring(0, 100)}...` : undefined,
      // Full request params if available
      ...fullRequestParams
    }
  }

  // Add to server-side logs
  addServerLog(logEntry)

  console.log(`[${logEntry.step}]`, logEntry)

  return logEntry
}

/**
 * Log an OpenAI Vision API response
 * @param traceId Trace ID for correlating logs
 * @param response The response from the OpenAI API
 */
export async function logOpenAIVisionResponse(traceId: string, response: any) {
  // Create log entry with food items detected
  const foodItems = response?.data?.foodItems || []
  const extractedText = response?.data?.extractedText || []

  const logEntry = {
    timestamp: new Date().toISOString(),
    traceId,
    step: FoodIdentificationStep.OPENAI_VISION_RESPONSE,
    message: "OpenAI Vision API Response",
    data: {
      success: response?.isSuccess === true,
      message: response?.message || "",
      foodItems,
      foodItemCount: foodItems.length,
      extractedText,
      extractedTextCount: extractedText.length,
      // Include truncated full response for debugging
      response:
        JSON.stringify(response).substring(0, 1000) +
        (JSON.stringify(response).length > 1000 ? "..." : "")
    }
  }

  // Add to server-side logs
  addServerLog(logEntry)

  console.log(`[${logEntry.step}]`, logEntry)

  return logEntry
}

/**
 * Log a Nutrition API request
 * @param traceId Trace ID for correlating logs
 * @param source The API source (USDA, OpenFoodFacts)
 * @param params The parameters sent to the API
 */
export async function logNutritionAPIRequest(
  traceId: string,
  source: string,
  params: any
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    traceId,
    step: FoodIdentificationStep.NUTRITION_API_REQUEST,
    message: `${source} Nutrition API Request`,
    data: {
      source,
      params
    }
  }

  // Add to server-side logs
  addServerLog(logEntry)

  console.log(`[${logEntry.step}]`, logEntry)

  return logEntry
}

/**
 * Log a Nutrition API response
 * @param traceId Trace ID for correlating logs
 * @param source The API source (USDA, OpenFoodFacts)
 * @param data The response data from the API
 */
export async function logNutritionAPIResponse(
  traceId: string,
  source: string,
  data: any
) {
  // Extract sample results for logging
  let sampleResults
  if (data && Array.isArray(data.items) && data.items.length > 0) {
    // Take just the first result and omit large fields
    sampleResults = data.items.slice(0, 1).map((item: any) => ({
      name: item.name,
      calories: item.nutrition?.calories,
      protein: item.nutrition?.protein,
      carbs: item.nutrition?.carbs,
      fat: item.nutrition?.fat,
      source: item.source,
      confidence: item.confidence
    }))
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    traceId,
    step: FoodIdentificationStep.NUTRITION_API_RESPONSE,
    message: `${source} Nutrition API Response`,
    data: {
      source,
      totalItems: data?.items?.length || 0,
      totalHits: data?.totalHits,
      sampleResults,
      // Include truncated full response for debugging if needed
      response:
        JSON.stringify(data).substring(0, 500) +
        (JSON.stringify(data).length > 500 ? "..." : "")
    }
  }

  // Add to server-side logs
  addServerLog(logEntry)

  console.log(`[${logEntry.step}]`, logEntry)

  return logEntry
}

/**
 * Log final selected food item(s)
 * @param traceId Trace ID for correlating logs
 * @param foodItem The final food item(s) selected
 */
export async function logFinalFoodItem(traceId: string, foodItem: any) {
  // Handle both single food item and array of food items
  const foodItems = Array.isArray(foodItem) ? foodItem : [foodItem]

  // Create simplified food items for logging
  const simplifiedItems = foodItems.map(item => ({
    name: item.name,
    calories: item.nutrition?.calories || item.calories,
    protein: item.nutrition?.protein || item.protein,
    carbs: item.nutrition?.carbs || item.carbs,
    fat: item.nutrition?.fat || item.fat,
    source: item.source,
    confidence: item.confidence
  }))

  const logEntry = {
    timestamp: new Date().toISOString(),
    traceId,
    step: FoodIdentificationStep.FINAL_FOOD_ITEM,
    message: "Final Food Item(s) Selected",
    data: {
      count: foodItems.length,
      items: simplifiedItems
    }
  }

  // Add to server-side logs
  addServerLog(logEntry)

  console.log(`[${logEntry.step}]`, logEntry)

  return logEntry
}

/**
 * Log an API error
 * @param traceId Trace ID for correlating logs
 * @param step The step where the error occurred
 * @param error The error object
 */
export async function logAPIError(
  traceId: string,
  step: FoodIdentificationStep,
  error: any
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    traceId,
    step,
    message: "API Error",
    data: {
      message: error.message || String(error),
      stack: error.stack
    }
  }

  // Add to server-side logs
  addServerLog(logEntry)

  console.error(`[${step}] Error:`, error)
  console.log(`[${step}]`, logEntry)

  return logEntry
}
