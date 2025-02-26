/**
 * @description
 * Server actions for image storage using Supabase.
 * Provides functions to upload, retrieve, and delete images.
 * 
 * Features:
 * - Secure uploads to user-specific paths
 * - File validation for size and type
 * - Unique filenames with timestamps
 * - Public and signed URL generation
 * 
 * @dependencies
 * - @supabase/supabase-js: For Supabase storage access
 * - @clerk/nextjs/server: For user authentication
 * - @/types: For ActionState type
 */

"use server"

import { createClient } from "@supabase/supabase-js"
import { auth } from "@clerk/nextjs/server"
import { ActionState } from "@/types"

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MEAL_IMAGES_BUCKET = process.env.SUPABASE_BUCKET_RECEIPTS || "meal-images"

/**
 * Initialize Supabase client with service role for admin access
 * Using service role allows us to bypass RLS policies when needed
 */
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Validates that a file meets the size and type requirements
 * 
 * @param file - The file to validate
 * @returns An object with validation result and error message if any
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: "No file provided" }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File size exceeds 10MB limit" }
  }
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: "Only JPEG, PNG, and WebP files are allowed" }
  }

  return { valid: true }
}

/**
 * Uploads an image file to Supabase storage
 * 
 * @param file - The image file to upload
 * @param folder - Optional subfolder within the user's directory
 * @returns Promise with ActionState containing the file path if successful
 */
export async function uploadImageStorage(
  file: File,
  folder: string = "meal"
): Promise<ActionState<{ path: string; url: string }>> {
  try {
    // Authenticate user with Clerk
    const { userId } = await auth()
    if (!userId) {
      return { 
        isSuccess: false, 
        message: "You must be logged in to upload images" 
      }
    }

    // Validate the file
    const validation = validateFile(file)
    if (!validation.valid) {
      return { 
        isSuccess: false, 
        message: validation.error || "Invalid file" 
      }
    }

    // Get Supabase client
    const supabase = getSupabaseAdmin()

    // Create a unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filePath = `${userId}/${folder}/${timestamp}-${file.name}`

    // Upload to the bucket
    const { data, error } = await supabase.storage
      .from(MEAL_IMAGES_BUCKET)
      .upload(filePath, file, {
        upsert: false,
        contentType: file.type
      })

    if (error) {
      console.error("Supabase upload error:", error)
      return { 
        isSuccess: false, 
        message: `Failed to upload image: ${error.message}` 
      }
    }

    // Generate a URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(MEAL_IMAGES_BUCKET)
      .getPublicUrl(data.path)

    return {
      isSuccess: true,
      message: "Image uploaded successfully",
      data: { 
        path: data.path,
        url: urlData.publicUrl
      }
    }
  } catch (error) {
    console.error("Error in uploadImageStorage:", error)
    return {
      isSuccess: false,
      message: `Failed to upload image: ${error instanceof Error ? error.message : "Unknown error"}`
    }
  }
}

/**
 * Gets a public URL for an image
 * 
 * @param path - The path of the image in storage
 * @returns Promise with ActionState containing the public URL
 */
export async function getImageUrlStorage(
  path: string
): Promise<ActionState<{ url: string }>> {
  try {
    // Authenticate user with Clerk
    const { userId } = await auth()
    if (!userId) {
      return { 
        isSuccess: false, 
        message: "You must be logged in to access images" 
      }
    }

    // Verify that the path belongs to the user
    if (!path.startsWith(`${userId}/`)) {
      return { 
        isSuccess: false, 
        message: "You don't have permission to access this image" 
      }
    }

    // Get Supabase client
    const supabase = getSupabaseAdmin()

    // Generate a public URL
    const { data } = supabase.storage
      .from(MEAL_IMAGES_BUCKET)
      .getPublicUrl(path)

    return {
      isSuccess: true,
      message: "Image URL generated successfully",
      data: { url: data.publicUrl }
    }
  } catch (error) {
    console.error("Error in getImageUrlStorage:", error)
    return {
      isSuccess: false,
      message: `Failed to get image URL: ${error instanceof Error ? error.message : "Unknown error"}`
    }
  }
}

/**
 * Deletes an image from storage
 * 
 * @param path - The path of the image to delete
 * @returns Promise with ActionState indicating success or failure
 */
export async function deleteImageStorage(
  path: string
): Promise<ActionState<void>> {
  try {
    // Authenticate user with Clerk
    const { userId } = await auth()
    if (!userId) {
      return { 
        isSuccess: false, 
        message: "You must be logged in to delete images" 
      }
    }

    // Verify that the path belongs to the user
    if (!path.startsWith(`${userId}/`)) {
      return { 
        isSuccess: false, 
        message: "You don't have permission to delete this image" 
      }
    }

    // Get Supabase client
    const supabase = getSupabaseAdmin()

    // Delete the file
    const { error } = await supabase.storage
      .from(MEAL_IMAGES_BUCKET)
      .remove([path])

    if (error) {
      console.error("Supabase delete error:", error)
      return { 
        isSuccess: false, 
        message: `Failed to delete image: ${error.message}` 
      }
    }

    return {
      isSuccess: true,
      message: "Image deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error in deleteImageStorage:", error)
    return {
      isSuccess: false,
      message: `Failed to delete image: ${error instanceof Error ? error.message : "Unknown error"}`
    }
  }
} 