/**
 * @description
 * Server actions for food detection using AI image processing.
 * These actions handle the processing of food images to identify food items
 * and extract text information.
 *
 * @dependencies
 * - @/types: For ActionState type
 * - @clerk/nextjs/server: For authentication
 * - @supabase/auth-helpers-nextjs: For Supabase storage access
 * - @/lib/api/openai-vision: For OpenAI Vision API integration
 */

"use server"

import { ActionState } from "@/types"
import { auth } from "@clerk/nextjs/server"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { processImageWithOpenAI } from "@/lib/api/openai-vision"

// Define interfaces for food detection results
export interface FoodItem {
  name: string
  confidence?: number
}

export interface FoodDetectionResult {
  foodItems: FoodItem[]
  extractedText: string[]
}

// Error messages for various food detection failures
const ERROR_MESSAGES = {
  UNAUTHORIZED: "You must be logged in to process images",
  INVALID_URL: "The provided URL is invalid or inaccessible",
  INVALID_IMAGE: "The file is not a valid image or cannot be processed",
  LOW_QUALITY: "The image quality is too low for accurate food detection",
  NO_FOOD_DETECTED: "No food items were detected in this image",
  ACCESS_DENIED: "You don't have permission to access this image",
  API_ERROR: "There was an error processing the image with AI",
  GENERAL_ERROR: "An unexpected error occurred while processing the image"
}

/**
 * Process an image to detect food items and extract text
 * Uses OpenAI Vision API to analyze the image and identify food items
 * 
 * @param imageData Base64 image data or URL to process
 * @returns Promise with detection results
 */
export async function detectFoodInImageAction(
  imageData: string
): Promise<ActionState<FoodDetectionResult>> {
  try {
    // Validate input
    if (!imageData || typeof imageData !== 'string') {
      return {
        isSuccess: false,
        message: ERROR_MESSAGES.INVALID_URL
      }
    }

    // Process the image with OpenAI Vision API
    const result = await processImageWithOpenAI(imageData)
    
    // Handle processing errors
    if (!result.isSuccess) {
      return {
        isSuccess: false,
        message: result.message || ERROR_MESSAGES.API_ERROR
      }
    }
    
    // If no food items were detected, return a specific message
    if (!result.data.foodItems || result.data.foodItems.length === 0) {
      return {
        isSuccess: false,
        message: ERROR_MESSAGES.NO_FOOD_DETECTED
      }
    }
    
    return {
      isSuccess: true,
      message: "Food items detected successfully",
      data: {
        foodItems: result.data.foodItems,
        extractedText: result.data.extractedText || []
      }
    }
    
  } catch (error) {
    console.error("Error in detectFoodInImageAction:", error)
    return {
      isSuccess: false,
      message: `Failed to process image: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * Process an image from a Supabase storage bucket
 * This ensures proper authentication and access control
 * 
 * @param imagePath Path to the image in the Supabase storage bucket
 * @returns Promise with detection results
 */
export async function detectFoodFromStorageAction(
  imagePath: string
): Promise<ActionState<FoodDetectionResult>> {
  // Check authentication
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: ERROR_MESSAGES.UNAUTHORIZED }
  }

  // Validate imagePath format and ownership
  if (!imagePath || typeof imagePath !== 'string') {
    return { isSuccess: false, message: ERROR_MESSAGES.INVALID_URL }
  }

  const pathParts = imagePath.split("/")
  if (pathParts.length < 2) {
    return { isSuccess: false, message: ERROR_MESSAGES.INVALID_URL }
  }

  const [pathUserId, ...rest] = pathParts
  if (pathUserId !== userId) {
    return { isSuccess: false, message: ERROR_MESSAGES.ACCESS_DENIED }
  }

  try {
    // Create Supabase client and generate signed URL
    const supabase = createClientComponentClient()
    
    try {
      const { data, error } = await supabase.storage
        .from("meal-images")
        .createSignedUrl(imagePath, 60)

      if (error) {
        console.error("Supabase storage error:", error)
        return { 
          isSuccess: false, 
          message: `Storage error: ${error.message}` 
        }
      }

      if (!data || !data.signedUrl) {
        return { 
          isSuccess: false, 
          message: ERROR_MESSAGES.INVALID_URL 
        }
      }
      
      // Process the image with the signed URL
      return await detectFoodInImageAction(data.signedUrl)
      
    } catch (storageError) {
      console.error("Storage operation error:", storageError)
      return { 
        isSuccess: false, 
        message: ERROR_MESSAGES.ACCESS_DENIED 
      }
    }
  } catch (error) {
    console.error("Error detecting food from storage:", error)
    
    // Determine the type of error for a more helpful message
    let errorMessage = ERROR_MESSAGES.GENERAL_ERROR
    
    if (error instanceof Error) {
      const errorText = error.message.toLowerCase()
      
      if (errorText.includes("unauthorized") || errorText.includes("permission")) {
        errorMessage = ERROR_MESSAGES.ACCESS_DENIED
      } else if (errorText.includes("url") || errorText.includes("format")) {
        errorMessage = ERROR_MESSAGES.INVALID_URL
      } else if (errorText.includes("image") || errorText.includes("file")) {
        errorMessage = ERROR_MESSAGES.INVALID_IMAGE
      } else if (errorText.includes("api") || errorText.includes("openai")) {
        errorMessage = ERROR_MESSAGES.API_ERROR
      }
    }
    
    return {
      isSuccess: false,
      message: errorMessage
    }
  }
}

/**
 * Filter and refine a list of detected food items
 * Useful for removing low-confidence items or normalizing names
 * 
 * @param foodItems Array of detected food items
 * @param confidenceThreshold Minimum confidence level (0-1)
 * @returns Promise with filtered food items
 */
export async function refineFoodItemsAction(
  foodItems: FoodItem[],
  confidenceThreshold: number = 0.7
): Promise<ActionState<FoodItem[]>> {
  try {
    // Validate input
    if (!Array.isArray(foodItems)) {
      return {
        isSuccess: false,
        message: "Food items must be an array"
      }
    }

    // Validate confidence threshold
    if (confidenceThreshold < 0 || confidenceThreshold > 1) {
      return {
        isSuccess: false,
        message: "Confidence threshold must be between 0 and 1"
      }
    }

    // Filter items based on confidence threshold and normalize
    const filteredItems = foodItems
      // Keep items that either have no confidence score or meet the threshold
      .filter(item => !item.confidence || item.confidence >= confidenceThreshold)
      // Normalize item properties
      .map(item => ({
        name: typeof item.name === 'string' ? item.name.trim() : '',
        confidence: typeof item.confidence === 'number' ? item.confidence : undefined
      }))
      // Remove items with empty names
      .filter(item => item.name.length > 0)

    // Sort by confidence (highest first)
    filteredItems.sort((a, b) => {
      const confA = a.confidence ?? 0
      const confB = b.confidence ?? 0
      return confB - confA
    })

    return {
      isSuccess: true,
      message: "Food items refined successfully",
      data: filteredItems
    }
  } catch (error) {
    console.error("Error in refineFoodItemsAction:", error)
    return {
      isSuccess: false,
      message: `Failed to refine food items: ${error instanceof Error ? error.message : String(error)}`
    }
  }
} 