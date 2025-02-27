/**
 * @description
 * This file contains server actions for processing images with AI.
 * It provides functionality to identify food items and extract text from images.
 * 
 * @dependencies
 * - @/lib/api/openai-vision: Used for processing images with OpenAI
 * - @/types: Used for ActionState type
 * - @clerk/nextjs/server: Used for authentication
 * - @supabase/auth-helpers-nextjs: Used for Supabase storage access
 */

"use server"

import { ActionState } from "@/types"
import { FoodItem, ImageProcessingResult, processImageWithOpenAI } from "@/lib/api/openai-vision"
import { auth } from "@clerk/nextjs/server"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

/**
 * Descriptive error messages for various image processing failures
 */
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
 * Error types for image processing
 */
export enum ImageProcessingErrorType {
  UNAUTHORIZED = "unauthorized",
  INVALID_URL = "invalid_url",
  INVALID_IMAGE = "invalid_image",
  LOW_QUALITY = "low_quality",
  NO_FOOD_DETECTED = "no_food_detected",
  ACCESS_DENIED = "access_denied",
  API_ERROR = "api_error",
  GENERAL_ERROR = "general_error"
}

/**
 * @deprecated Use processStoredImageAction or processPublicImageAction instead,
 * which include proper authentication and security checks.
 */
export async function processImageAction(
  imageUrl: string
): Promise<ActionState<ImageProcessingResult>> {
  console.warn("Warning: Using deprecated processImageAction without authentication")
  try {
    // Validate input
    if (!imageUrl) {
      return {
        isSuccess: false,
        message: ERROR_MESSAGES.INVALID_URL
      }
    }

    // Validate URL format
    try {
      new URL(imageUrl)
    } catch (e) {
      return {
        isSuccess: false,
        message: ERROR_MESSAGES.INVALID_URL
      }
    }

    // Process the image with OpenAI Vision API
    const result = await processImageWithOpenAI(imageUrl)

    // Return the processed result
    return result
  } catch (error) {
    console.error("Error in processImageAction:", error)
    return {
      isSuccess: false,
      message: `Failed to process image: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * Normalizes and validates the image processing result
 * This ensures consistent formatting and handles edge cases like empty or malformed results
 * 
 * @param result - The raw result from the OpenAI Vision API
 * @returns Normalized and validated ImageProcessingResult
 */
export async function normalizeProcessingResult(result: ActionState<ImageProcessingResult>): Promise<ActionState<ImageProcessingResult>> {
  // If the result already failed, return it as is
  if (!result.isSuccess) {
    return result;
  }

  try {
    const { foodItems = [], extractedText = [] } = result.data;

    // Helper function to ensure each item is a properly formatted FoodItem
    const ensureFoodItem = (item: any): FoodItem => {
      return {
        name: typeof item.name === 'string' ? item.name.trim() : '',
        confidence: typeof item.confidence === 'number' && !isNaN(item.confidence)
          ? Math.min(Math.max(item.confidence, 0), 1) // Ensure confidence is between 0 and 1
          : 0 // Default to 0 if confidence is missing or invalid
      };
    };

    // Normalize food items and ensure they match the FoodItem interface
    const normalizedFoodItems: FoodItem[] = foodItems
      .map(ensureFoodItem)
      .filter(item => item.name !== ''); // Remove items with empty names

    // Normalize extracted text
    const normalizedText = extractedText
      .filter(text => typeof text === 'string' && text.trim().length > 0)
      .map(text => text.trim());

    // Check if we have any valid food items
    if (normalizedFoodItems.length === 0) {
      return {
        isSuccess: true,
        message: "No food items detected in the image",
        data: {
          foodItems: [],
          extractedText: normalizedText
        }
      };
    }

    return {
      isSuccess: true,
      message: "Image processed successfully",
      data: {
        foodItems: normalizedFoodItems,
        extractedText: normalizedText
      }
    };
  } catch (error) {
    console.error("Error normalizing processing result:", error);
    return {
      isSuccess: false,
      message: ERROR_MESSAGES.GENERAL_ERROR,
    };
  }
}

/**
 * Server action to filter and refine detected food items.
 * This can be used to filter out low-confidence detections or combine similar items.
 * 
 * @param foodItems - Array of detected food items
 * @param confidenceThreshold - Optional minimum confidence threshold (0-1)
 * @returns Promise<ActionState<FoodItem[]>> - Filtered food items
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
      .filter(item => typeof item.confidence !== 'number' || item.confidence >= confidenceThreshold)
      // Normalize item properties
      .map(item => ({
        name: typeof item.name === 'string' ? item.name.trim() : '',
        confidence: typeof item.confidence === 'number' ? item.confidence : 0 // Default to 0 instead of undefined
      }))
      // Remove items with empty names
      .filter(item => item.name.length > 0);

    // Sort by confidence (highest first)
    filteredItems.sort((a, b) => b.confidence - a.confidence);

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

/**
 * Analyzes image quality and content to check for potential processing issues
 * 
 * @param result - The image processing result to analyze
 * @returns The original result or an error if quality issues are detected
 */
export async function validateImageContent(result: ActionState<ImageProcessingResult>): Promise<ActionState<ImageProcessingResult>> {
  // If the result already failed, return it as is
  if (!result.isSuccess) {
    return result;
  }

  const { foodItems, extractedText } = result.data;
  
  // Check if there are no food items and no text - might indicate a poor quality image
  if (foodItems.length === 0 && extractedText.length === 0) {
    return {
      isSuccess: false,
      message: ERROR_MESSAGES.LOW_QUALITY,
    };
  }

  // Check if all confidence scores are very low (< 0.3) - might indicate uncertainty
  const allLowConfidence = foodItems.length > 0 && 
    foodItems.every(item => item.confidence !== undefined && item.confidence < 0.3);
  
  if (allLowConfidence) {
    // We still return success but with a warning message
    return {
      isSuccess: true,
      message: "Food items detected with low confidence. Results may not be accurate.",
      data: result.data
    };
  }
  
  return result;
}

// Primary function for processing images from Supabase storage
export async function processStoredImageAction(
  imagePath: string
): Promise<ActionState<ImageProcessingResult>> {
  // Get the current user's ID from Clerk
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: ERROR_MESSAGES.UNAUTHORIZED }
  }

  // Validate imagePath format and ownership
  if (!imagePath || typeof imagePath !== 'string') {
    return { isSuccess: false, message: ERROR_MESSAGES.INVALID_URL };
  }

  const pathParts = imagePath.split("/");
  if (pathParts.length < 2) {
    return { isSuccess: false, message: ERROR_MESSAGES.INVALID_URL };
  }

  const [pathUserId, ...rest] = pathParts;
  if (pathUserId !== userId) {
    return { isSuccess: false, message: ERROR_MESSAGES.ACCESS_DENIED }
  }

  try {
    // Create Supabase client and generate signed URL
    const supabase = createClientComponentClient()
    
    // Use a try-catch specifically for the storage operation
    try {
      const { data, error } = await supabase.storage
        .from("meal-images")
        .createSignedUrl(imagePath, 60)

      if (error) {
        console.error("Supabase storage error:", error);
        return { 
          isSuccess: false, 
          message: `Storage error: ${error.message}` 
        };
      }

      if (!data || !data.signedUrl) {
        return { 
          isSuccess: false, 
          message: ERROR_MESSAGES.INVALID_URL 
        };
      }
      
      // Process the image with the signed URL
      const result = await processImageWithOpenAI(data.signedUrl);
      
      // Normalize and validate the result
      const normalizedResult = await normalizeProcessingResult(result);
      return await validateImageContent(normalizedResult);
      
    } catch (storageError) {
      console.error("Storage operation error:", storageError);
      return { 
        isSuccess: false, 
        message: ERROR_MESSAGES.ACCESS_DENIED 
      };
    }
  } catch (error) {
    console.error("Error processing stored image:", error);
    
    // Determine the type of error for a more helpful message
    let errorMessage = ERROR_MESSAGES.GENERAL_ERROR;
    
    if (error instanceof Error) {
      const errorText = error.message.toLowerCase();
      
      if (errorText.includes("unauthorized") || errorText.includes("permission")) {
        errorMessage = ERROR_MESSAGES.ACCESS_DENIED;
      } else if (errorText.includes("url") || errorText.includes("format")) {
        errorMessage = ERROR_MESSAGES.INVALID_URL;
      } else if (errorText.includes("image") || errorText.includes("file")) {
        errorMessage = ERROR_MESSAGES.INVALID_IMAGE;
      } else if (errorText.includes("api") || errorText.includes("openai")) {
        errorMessage = ERROR_MESSAGES.API_ERROR;
      }
    }
    
    return {
      isSuccess: false,
      message: errorMessage
    }
  }
}

// Secondary function for processing public URLs (for testing or external sources)
export async function processPublicImageAction(
  imageUrl: string
): Promise<ActionState<ImageProcessingResult>> {
  // Get the current user's ID from Clerk (still require authentication)
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: ERROR_MESSAGES.UNAUTHORIZED }
  }
  
  // Validate URL
  if (!imageUrl || typeof imageUrl !== 'string') {
    return { isSuccess: false, message: ERROR_MESSAGES.INVALID_URL };
  }
  
  try {
    // Validate URL format
    try {
      new URL(imageUrl)
    } catch (e) {
      return { isSuccess: false, message: ERROR_MESSAGES.INVALID_URL };
    }
    
    // Process the image directly
    const result = await processImageWithOpenAI(imageUrl);
    
    // Normalize and validate the result
    const normalizedResult = await normalizeProcessingResult(result);
    return await validateImageContent(normalizedResult);
    
  } catch (error) {
    console.error("Error processing public image:", error);
    
    // Determine the type of error for a more helpful message
    let errorMessage = ERROR_MESSAGES.GENERAL_ERROR;
    
    if (error instanceof Error) {
      const errorText = error.message.toLowerCase();
      
      if (errorText.includes("url") || errorText.includes("access")) {
        errorMessage = ERROR_MESSAGES.INVALID_URL;
      } else if (errorText.includes("image") || errorText.includes("file")) {
        errorMessage = ERROR_MESSAGES.INVALID_IMAGE;
      } else if (errorText.includes("api") || errorText.includes("openai")) {
        errorMessage = ERROR_MESSAGES.API_ERROR;
      }
    }
    
    return {
      isSuccess: false, 
      message: errorMessage
    }
  }
}
