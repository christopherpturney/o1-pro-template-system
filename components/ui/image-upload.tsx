"use client"

/**
 * @description
 * A reusable image upload component that supports:
 * - File selection via button
 * - Drag and drop
 * - Image preview
 * - File validation
 * - Error handling
 *
 * @example
 * <ImageUpload
 *   onUpload={(file) => handleUpload(file)}
 *   maxSizeMB={5}
 *   acceptedTypes={["image/jpeg", "image/png", "image/webp"]}
 * />
 *
 * @dependencies
 * - react-dropzone: For drag and drop functionality
 * - lucide-react: For icons
 */

import { cn } from "@/lib/utils"
import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Camera, Upload, X } from "lucide-react"
import { Button } from "./button"
import { LoadingSpinner } from "./loading-spinner"

export interface ImageUploadProps {
  onUpload: (file: File) => Promise<void>
  maxSizeMB?: number
  acceptedTypes?: string[]
  className?: string
}

export function ImageUpload({
  onUpload,
  maxSizeMB = 5,
  acceptedTypes = ["image/jpeg", "image/png", "image/webp"],
  className
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      // Validate file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File size must be less than ${maxSizeMB}MB`)
        return
      }

      // Validate file type
      if (!acceptedTypes.includes(file.type)) {
        setError(`File type must be one of: ${acceptedTypes.join(", ")}`)
        return
      }

      // Create preview
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)
      setError(null)

      try {
        setIsUploading(true)
        await onUpload(file)
      } catch (err) {
        setError("Failed to upload image. Please try again.")
        setPreview(null)
      } finally {
        setIsUploading(false)
      }

      // Cleanup preview URL
      return () => URL.revokeObjectURL(objectUrl)
    },
    [maxSizeMB, acceptedTypes, onUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": acceptedTypes
    },
    maxFiles: 1,
    multiple: false
  })

  const clearPreview = () => {
    setPreview(null)
    setError(null)
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "relative flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-gray-300 dark:border-gray-700",
          preview ? "border-none p-0" : ""
        )}
      >
        <input {...getInputProps()} />

        {isUploading ? (
          <div className="flex flex-col items-center justify-center space-y-2">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-500">Uploading...</p>
          </div>
        ) : preview ? (
          <div className="relative w-full">
            <img
              src={preview}
              alt="Preview"
              className="size-full rounded-lg object-cover"
            />
            <Button
              size="icon"
              variant="destructive"
              className="absolute right-2 top-2"
              onClick={e => {
                e.stopPropagation()
                clearPreview()
              }}
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="bg-primary/10 rounded-full p-4">
              {isDragActive ? (
                <Upload className="text-primary size-8" />
              ) : (
                <Camera className="text-primary size-8" />
              )}
            </div>
            <div className="flex flex-col items-center space-y-1">
              <p className="text-sm font-medium">
                {isDragActive ? "Drop the image here" : "Upload an image"}
              </p>
              <p className="text-xs text-gray-500">
                Drag & drop or click to select
              </p>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-destructive mt-2 text-sm">{error}</p>}
    </div>
  )
}
