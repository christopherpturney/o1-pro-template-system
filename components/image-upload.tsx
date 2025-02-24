"use client"

/**
 * @description
 * This client component provides an interface for users to capture or upload images.
 * It supports camera capture (on supported devices) and file upload via drag-and-drop or click.
 *
 * Key features:
 * - Image Capture/Upload: Supports camera input and file selection
 * - Validation: Enforces file size (max 10MB) and type (JPEG, PNG, WebP) restrictions
 * - Preview: Displays the selected image
 * - Mobile-Friendly: Responsive design with Tailwind CSS
 *
 * @dependencies
 * - react: For state management (useState)
 * - react-dropzone: For drag-and-drop file upload functionality
 * - lucide-react: For icons (Camera, Upload)
 * - "@/components/ui/button": For styled buttons
 * - "@/lib/utils": For className utility (cn)
 *
 * @notes
 * - Marked as "use client" due to client-side interactions (file handling, camera access)
 * - File validation aligns with storage rules from project_rules
 * - Assumes parent component will handle the uploaded file (e.g., via server action)
 * - Does not handle upload to Supabase directly—passes file to parent via callback
 */

import { useState } from "react"
import { useDropzone } from "react-dropzone"
import { Camera, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Props interface for the component
interface ImageUploadProps {
  onImageSelected: (file: File) => void // Callback to pass selected file to parent
}

// Validation constants per storage rules
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

export default function ImageUpload({ onImageSelected }: ImageUploadProps) {
  // State for the selected image preview and error message
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Validate file based on size and type
  const validateFile = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      setError("File size exceeds 10MB limit")
      return false
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPEG, PNG, and WebP files are allowed")
      return false
    }
    return true
  }

  // Handle file selection (from dropzone or input)
  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file || !validateFile(file)) return

    // Clear any previous error and set preview
    setError(null)
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)
    onImageSelected(file)

    // Note: Preview URL is not revoked here as it’s tied to component lifecycle;
    // parent component should handle cleanup if needed
  }

  // Configure react-dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_TYPES.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: MAX_FILE_SIZE,
    multiple: false // Only one image at a time
  })

  return (
    <div className="w-full max-w-md">
      {/* Dropzone area */}
      <div
        {...getRootProps()}
        className={cn(
          "cursor-pointer rounded-lg border-2 border-dashed p-6 text-center",
          isDragActive ? "border-primary bg-muted" : "border-muted",
          preview ? "border-none p-0" : ""
        )}
      >
        <input {...getInputProps()} capture="environment" />{" "}
        {/* Camera support */}
        {preview ? (
          // Image preview
          <img
            src={preview}
            alt="Selected food image"
            className="h-auto w-full rounded-lg"
          />
        ) : (
          // Upload prompt
          <div className="space-y-4">
            <Upload className="text-muted-foreground mx-auto size-8" />
            <p className="text-muted-foreground">
              {isDragActive
                ? "Drop your image here"
                : "Drag & drop an image, or click to select"}
            </p>
            <Button variant="outline" className="mt-2">
              <Camera className="mr-2 size-4" />
              Take or Upload Photo
            </Button>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-destructive mt-2 text-center text-sm">{error}</p>
      )}

      {/* Instructions */}
      {!preview && (
        <p className="text-muted-foreground mt-2 text-center text-xs">
          Max file size: 10MB. Supported formats: JPEG, PNG, WebP.
        </p>
      )}
    </div>
  )
}
