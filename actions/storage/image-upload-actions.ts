"use server"

/**
 * @description
 * This server action handles uploading images to a Supabase storage bucket.
 * It validates the file, constructs a unique path, and stores the image securely.
 * 
 * Key features:
 * - Authentication: Ensures only authenticated users can upload via Clerk
 * - Validation: Checks file size and type per storage rules
 * - Storage: Uploads to the 'meal-images' bucket with a user-specific path
 * - Response: Returns an ActionState with the uploaded path or error
 * 
 * @dependencies
 * - @supabase/auth-helpers-nextjs: For Supabase client creation
 * - @clerk/nextjs/server: For user authentication
 * - "@/types": For ActionState type definition
 * 
 * @notes
 * - Marked as "use server" per project rules for server actions
 * - Bucket name 'meal-images' is hardcoded here; should match Step 18 setup
 * - File path includes userId and timestamp for uniqueness and organization
 * - Does not handle image processing (Step 21 will cover that)
 */

import { createClient } from "@supabase/supabase-js"
import { auth } from "@clerk/nextjs/server"
import { ActionState } from "@/types"

// Validation constants (mirroring ImageUpload for consistency)
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

// Interface for upload input
interface UploadImageInput {
  file: File // The image file to upload
}

/**
 * Uploads an image to the 'meal-images' bucket in Supabase.
 * @param {UploadImageInput} input - The file to upload
 * @returns {Promise<ActionState<{ path: string }>>} - Success with path or error
 */
export async function uploadImageAction({
  file
}: UploadImageInput): Promise<ActionState<{ path: string }>> {
  // Get authenticated user ID from Clerk
  const { userId } = await auth()
  if (!userId) {
    return {
      isSuccess: false,
      message: "Unauthorized: You must be logged in to upload images"
    }
  }

  // Validate file
  if (file.size > MAX_FILE_SIZE) {
    return { isSuccess: false, message: "File size exceeds 10MB limit" }
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      isSuccess: false,
      message: "Only JPEG, PNG, and WebP files are allowed"
    }
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

    // Construct unique file path: meal-images/{userId}/meal/{timestamp}-{filename}
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-") // e.g., 2025-02-24T12-00-00-000Z -> 2025-02-24T12-00-00-000
    const fileExtension = file.name.split(".").pop() || "jpg"
    const filePath = `${userId}/meal/${timestamp}-${file.name}`

    // Upload to 'meal-images' bucket
    const { data, error } = await supabase.storage
      .from("meal-images")
      .upload(filePath, file, {
        upsert: false, // Fail if file exists (unlikely due to timestamp)
        contentType: file.type // Ensure correct MIME type
      })

    if (error) {
      throw new Error(error.message)
    }

    return {
      isSuccess: true,
      message: "Image uploaded successfully",
      data: { path: data.path } // e.g., "user123/meal/2025-02-24T12-00-00-000-image.jpg"
    }
  } catch (error) {
    console.error("Error uploading image:", error)
    return {
      isSuccess: false,
      message: "Failed to upload image: " + (error instanceof Error ? error.message : "Unknown error")
    }
  }
}