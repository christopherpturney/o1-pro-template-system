/**
 * @description
 * This file contains server actions for processing images with AI.
 * It provides functionality to identify food items and extract text from images.
 * 
 * @dependencies
 * - @/lib/api/openai-vision: Used for processing images with OpenAI
 * - @/types: Used for ActionState type
 */

"use server"

import { ActionState } from "@/types"
import { FoodItem, ImageProcessingResult, processImageWithOpenAI } from "@/lib/api/openai-vision"
import { auth } from "@clerk/nextjs/server"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

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
        message: "Image URL is required"
      }
    }

    // Validate URL format
    try {
      new URL(imageUrl)
    } catch (e) {
      return {
        isSuccess: false,
        message: "Invalid image URL format"
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

    // Filter items based on confidence threshold
    const filteredItems = foodItems.filter(
      item => !item.confidence || item.confidence >= confidenceThreshold
    )

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

// Primary function for processing images from Supabase storage
export async function processStoredImageAction(
  imagePath: string
): Promise<ActionState<ImageProcessingResult>> {
  // Get the current user's ID from Clerk
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized" }
  }

  // Validate imagePath format and ownership
  const [pathUserId, ...rest] = imagePath.split("/")
  if (pathUserId !== userId) {
    return { isSuccess: false, message: "Unauthorized" }
  }

  try {
    // Create Supabase client and generate signed URL
    const supabase = createClientComponentClient()
    const { data, error } = await supabase.storage
      .from("meal-images")
      .createSignedUrl(imagePath, 60)

    if (error) throw error
    
    // Process the image with the signed URL
    return await processImageWithOpenAI(data.signedUrl)
  } catch (error) {
    console.error("Error processing stored image:", error)
    return {
      isSuccess: false,
      message: `Failed to process image: ${error instanceof Error ? error.message : String(error)}`
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
    return { isSuccess: false, message: "Unauthorized" }
  }
  
  try {
    // Validate URL format
    new URL(imageUrl)
    
    // Process the image directly
    return await processImageWithOpenAI(imageUrl)
  } catch (error) {
    console.error("Error processing public image:", error)
    return {
      isSuccess: false, 
      message: `Failed to process image: ${error instanceof Error ? error.message : String(error)}`
    }
  }
} 