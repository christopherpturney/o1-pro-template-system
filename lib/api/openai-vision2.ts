/**
 * @description
 * This utility file handles interactions with the OpenAI Vision API for image analysis.
 * It provides a function to analyze images, identifying food items and extracting visible text.
 *
 * Key features:
 * - Initializes the OpenAI client with the API key from environment variables
 * - Sends image analysis requests to the OpenAI Vision API
 * - Parses and returns structured results from the API response
 *
 * @dependencies
 * - openai: OpenAI SDK for API interactions
 *
 * @notes
 * - Requires OPENAI_API_KEY in .env.local
 * - Uses the 'gpt-4-vision-preview' model, which may have usage restrictions
 * - Assumes the image URL is publicly accessible or a valid signed URL
 * - Error handling includes logging and rethrowing for upstream handling
 */

import OpenAI from "openai"

// Initialize OpenAI client with API key from environment
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/**
 * Interface for the image analysis result
 */
interface ImageAnalysisResult {
  foodItems: string[]
  extractedText: string[]
}

/**
 * Analyzes an image using the OpenAI Vision API to identify food items and extract text.
 *
 * @param imageUrl - The URL of the image to analyze (must be accessible by OpenAI)
 * @returns A promise resolving to the analysis result
 * @throws Error if the API call fails or the response cannot be parsed
 */
export async function analyzeImage(
  imageUrl: string
): Promise<ImageAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please identify all food items in this image and extract any visible text from menus, labels, or packaging. Provide the response in JSON format with two fields: 'foodItems' as an array of strings, and 'extractedText' as an array of strings."
            },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500
    })

    const content = response.choices[0].message.content
    if (!content) {
      throw new Error("No content in API response")
    }

    const result = JSON.parse(content) as ImageAnalysisResult
    return result
  } catch (error) {
    console.error("Error analyzing image:", error)
    throw error
  }
}
