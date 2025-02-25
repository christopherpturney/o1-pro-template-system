/**
 * @description
 * This server action module handles image processing requests for the AI Food Identifier.
 * It provides a server action to process images stored in Supabase, using the OpenAI Vision API.
 *
 * Key features:
 * - Authenticates the user and verifies image ownership
 * - Generates temporary signed URLs for image access
 * - Integrates with the OpenAI Vision API via utility functions
 * - Returns structured results or appropriate error messages
 *
 * @dependencies
 * - @clerk/nextjs/server: For user authentication
 * - @supabase/auth-helpers-nextjs: For Supabase client creation
 * - "@/lib/api/openai-vision": For image analysis utilities
 * - "@/types": For ActionState type
 *
 * @notes
 * - Requires proper setup of Supabase storage with RLS policies
 * - Assumes image paths are in the format "userId/imageId.jpg"
 * - Uses a 60-second expiration for signed URLs
 * - Error handling includes unauthorized access and API failures
 */

"use server"

import { auth } from "@clerk/nextjs/server"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { analyzeImage } from "@/lib/api/openai-vision2"
import { ActionState } from "@/types"

/**
 * Processes an image stored in Supabase using the OpenAI Vision API.
 *
 * @param imagePath - The path of the image in the Supabase storage bucket
 * @returns A promise resolving to the action state with analysis results or error
 */
export async function processImageAction(
  imagePath: string
): Promise<ActionState<{ foodItems: string[]; extractedText: string[] }>> {
  // Get the current user's ID from Clerk
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized" }
  }

  // Validate imagePath format and ownership
  // Assume imagePath is in the format "userId/imageId.jpg"
  const [pathUserId, ...rest] = imagePath.split("/")
  if (pathUserId !== userId) {
    return { isSuccess: false, message: "Unauthorized" }
  }

  try {
    // Create Supabase client
    const supabase = createClientComponentClient()

    // Generate a signed URL for the image with 60-second expiration
    const { data, error } = await supabase.storage
      .from("meal-images")
      .createSignedUrl(imagePath, 60)

    if (error) {
      throw error
    }

    const signedUrl = data.signedUrl

    // Analyze the image using OpenAI Vision API
    const result = await analyzeImage(signedUrl)

    return {
      isSuccess: true,
      message: "Image processed successfully",
      data: result
    }
  } catch (error) {
    console.error("Error processing image:", error)
    return { isSuccess: false, message: "Failed to process image" }
  }
}