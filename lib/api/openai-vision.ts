/**
 * @description
 * This file contains utility functions for interacting with the OpenAI Vision API.
 * It handles the API client setup and request logic for processing images.
 *
 * @dependencies
 * - openai: Used for calling the Vision API
 * - @/types: Used for ActionState type
 */

"use server"

import OpenAI from "openai"
import { ActionState } from "@/types"

// Initialize the OpenAI client with the API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

/**
 * Interface representing a food item detected by the AI
 */
export interface FoodItem {
  name: string
  confidence?: number
}

/**
 * Interface representing the result of image processing
 */
export interface ImageProcessingResult {
  foodItems: FoodItem[]
  extractedText: string[]
}

/**
 * Processes an image using OpenAI Vision API to identify food items and extract text.
 *
 * @param imageUrl - URL of the image to process (can be a public URL or a base64 data URL)
 * @returns A promise resolving to an ActionState with ImageProcessingResult data
 */
export async function processImageWithOpenAI(
  imageUrl: string
): Promise<ActionState<ImageProcessingResult>> {
  try {
    // Define the prompt for food detection and text extraction
    const prompt = `
    Analyze this image and identify all the food items present. 
    Also extract any visible text such as menu items, nutrition facts, or ingredient lists.
    
    Format your response as a valid JSON object with the following structure:
    {
      "foodItems": [
        { "name": "food item name", "confidence": 0.95 },
        ...
      ],
      "extractedText": [
        "line of text 1",
        "line of text 2",
        ...
      ]
    }
    
    For each food item, include a confidence score between 0 and 1 indicating your confidence in the identification.
    If there's no text in the image, return an empty array for extractedText.
    If there's no food in the image, return an empty array for foodItems.
    `

    // Call the OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      max_tokens: 1500
    })

    // Extract and parse the response
    const responseContent = response.choices[0]?.message?.content

    if (!responseContent) {
      throw new Error("No response from OpenAI")
    }

    // Extract the JSON from the response
    // The response might contain markdown formatting like ```json ... ```
    const jsonMatch =
      responseContent.match(/```json\s*([\s\S]*?)\s*```/) ||
      responseContent.match(/{[\s\S]*}/)

    let parsedResponse: ImageProcessingResult

    if (jsonMatch) {
      // Extract JSON content whether it's in a code block or just a plain JSON object
      const jsonString = jsonMatch[1] || jsonMatch[0]
      try {
        parsedResponse = JSON.parse(jsonString)
      } catch (e) {
        console.error("Failed to parse JSON match:", e)
        throw new Error("Failed to parse response from OpenAI")
      }
    } else {
      // If no JSON format found, try to parse the whole response
      try {
        parsedResponse = JSON.parse(responseContent)
      } catch (e) {
        console.error("Failed to parse response as JSON:", e)
        throw new Error("Failed to parse response from OpenAI")
      }
    }

    // Ensure the response has the expected structure
    if (!parsedResponse.foodItems) parsedResponse.foodItems = []
    if (!parsedResponse.extractedText) parsedResponse.extractedText = []

    return {
      isSuccess: true,
      message: "Image processed successfully",
      data: parsedResponse
    }
  } catch (error) {
    console.error("Error processing image with OpenAI:", error)
    return {
      isSuccess: false,
      message: `Failed to process image: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}
