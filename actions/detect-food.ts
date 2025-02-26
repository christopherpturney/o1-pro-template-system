"use server"

import { processImageWithOpenAI } from "@/lib/api/openai-vision"
import { ActionState, ImageProcessingResult } from "@/types"

/**
 * Server action to detect food in an uploaded image using AI
 * @param base64Image Base64-encoded image data
 * @param traceId Optional trace ID for logging purposes
 */
export async function detectFoodInImageAction(
  base64Image: string,
  traceId?: string
): Promise<ActionState<ImageProcessingResult>> {
  try {
    if (!base64Image) {
      return {
        isSuccess: false,
        message: "No image data provided"
      }
    }

    // Process the image with OpenAI Vision API
    return await processImageWithOpenAI(base64Image, traceId)
  } catch (error) {
    console.error("Error in detect food action:", error)
    return {
      isSuccess: false,
      message: "Failed to process image"
    }
  }
} 