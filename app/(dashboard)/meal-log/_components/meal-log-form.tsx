"use client"

/**
 * @description
 * This client component provides a form for logging a new meal.
 * It allows users to upload an image, with plans to add food item adjustments and meal saving in later steps.
 *
 * Key features:
 * - Image Upload: Integrates the ImageUpload component for file selection
 * - Form Submission: Uploads the image to Supabase via server action
 * - Responsive Design: Uses Tailwind CSS for a clean, mobile-friendly UI
 *
 * @dependencies
 * - react: For state management (useState)
 * - "@/components/image-upload": For image selection functionality
 * - "@/components/ui/button": For styled buttons
 * - "@/components/ui/card": For structured layout
 * - "@/actions/storage/image-upload-actions": For uploading to Supabase
 *
 * @notes
 * - Marked as "use client" due to interactive form handling
 * - Uploads image to Supabase; AI processing and meal saving to be added later
 * - Food item list (Step 24) and AI processing (Step 21) to be added in future steps
 */

import { useState } from "react"
import ImageUpload from "@/components/image-upload"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { uploadImageAction } from "@/actions/storage/image-upload-actions"

export default function MealLogForm() {
  // State to store the selected image file and upload status
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)

  // Handle image selection from ImageUpload component
  const handleImageSelected = (file: File) => {
    setSelectedImage(file)
    setUploadStatus(null) // Reset status on new selection
  }

  // Handle form submission with server action
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedImage) return

    setUploadStatus("Uploading...")

    // Call server action to upload image
    const result = await uploadImageAction({ file: selectedImage })

    if (result.isSuccess) {
      setUploadStatus(`Image uploaded successfully! Path: ${result.data.path}`)
      // TODO: Proceed with AI processing (Step 21) and meal saving (Step 28)
    } else {
      setUploadStatus(`Upload failed: ${result.message}`)
    }
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>Upload Your Meal</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image upload section */}
          <div>
            <ImageUpload onImageSelected={handleImageSelected} />
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={!selectedImage || uploadStatus === "Uploading..."}
            className="w-full"
          >
            Log Meal
          </Button>

          {/* Upload status */}
          {uploadStatus && (
            <p
              className={`text-center text-sm ${
                uploadStatus.includes("failed")
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {uploadStatus}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
