// app/(dashboard)/meal-log/_components/meal-log-form.tsx
"use client"

import { useState } from "react"
import ImageUpload from "@/components/image-upload"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function MealLogForm() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)

  const handleImageSelected = (file: File) => {
    setSelectedImage(file)
    setUploadStatus(null)
    console.log("Selected image:", file.name, file.size, file.type)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedImage) return

    setUploadStatus("Uploading...")

    const formData = new FormData()
    formData.append("file", selectedImage)

    try {
      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Upload failed")
      }

      const result = await response.json()
      setUploadStatus(`Image uploaded successfully! Path: ${result.path}`)
    } catch (error) {
      console.error("Upload error:", error)
      setUploadStatus(
        `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>Upload Your Meal</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <ImageUpload onImageSelected={handleImageSelected} />
          </div>
          <Button
            type="submit"
            disabled={!selectedImage || uploadStatus === "Uploading..."}
            className="w-full"
          >
            Log Meal
          </Button>
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
