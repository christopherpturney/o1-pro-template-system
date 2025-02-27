/**
 * @description
 * This file contains utility functions for interacting with the OpenAI Vision API.
 * It handles the API client setup and request logic for processing images.
 *
 * @dependencies
 * - openai: Used for calling the Vision API
 * - @/types: Used for ActionState type
 * - @/lib/api/api-logger: Used for logging API calls
 */

"use server"

import OpenAI from "openai"
import { ActionState } from "@/types"
import {
  logOpenAIVisionRequest,
  logOpenAIVisionResponse,
  logAPIError
} from "@/lib/api/api-logger"
import { FoodIdentificationStep } from "@/lib/food-logger"
import { auth } from "@clerk/nextjs/server"

// Define the response schema
const foodDetectionResponseSchema = {
  type: "object",
  properties: {
    foodItems: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          confidence: { type: "number" }
        },
        required: ["name", "confidence"]
      }
    },
    extractedText: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: ["foodItems", "extractedText"]
}

// Initialize the OpenAI client with the API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

/**
 * Interface representing a food item detected by the AI
 */
export interface FoodItem {
  name: string
  confidence: number
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
 * @param traceId - Optional trace ID for logging the request (if not provided, logging will be skipped)
 * @returns A promise resolving to an ActionState with ImageProcessingResult data
 */
export async function processImageWithOpenAI(
  imageUrl: string,
  traceId?: string
): Promise<ActionState<ImageProcessingResult>> {
  try {
    // Define the prompt for food detection and text extraction
    const prompt = `
    Analyze this image and identify all the food items present. 
    Also extract any visible text such as menu items, nutrition facts, or ingredient lists.
    
    Format your response as a valid JSON object with the following structure:
    {
      "foodItems": [
        { "name": "Food Item Name", "confidence": 0.95 },
        ...
      ],
      "extractedText": [
        "Line of text 1",
        "Line of text 2",
        ...
      ]
    }
    
    For each food item, include a confidence score between 0 and 1 indicating your confidence in the identification.
    If there's no text in the image, return an empty array for extractedText.
    If there's no food in the image, return an empty array for foodItems.
    Capitalize the first letter of the "Food item name".
    
    Important: Ensure the response is properly formatted as valid JSON.
    `

    // Log the OpenAI Vision API request if traceId is provided
    if (traceId) {
      // For logging purposes, create a simplified version of the request
      const requestForLogging = {
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: "[IMAGE_URL]" } }
            ]
          }
        ],
        temperature: 0.5,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      }

      await logOpenAIVisionRequest(traceId, imageUrl, prompt, requestForLogging)
    }

    // Call the OpenAI API with gpt-4o - using the proper typing for the SDK
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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
      temperature: 0.5,
      max_tokens: 1000,
      n: 1,
      response_format: { type: "json_object" }
    })

    // Log the OpenAI Vision API response if traceId is provided
    if (traceId) {
      await logOpenAIVisionResponse(traceId, response)
    }

    // Extract and parse the response
    const responseContent = response.choices[0]?.message?.content

    if (!responseContent) {
      const error = new Error("No response content from OpenAI")
      if (traceId) {
        await logAPIError(
          traceId,
          FoodIdentificationStep.OPENAI_VISION_RESPONSE,
          {
            message: "Empty response from OpenAI",
            response
          }
        )
      }
      throw error
    }

    // Default result in case parsing fails
    let parsedResponse: ImageProcessingResult = {
      foodItems: [],
      extractedText: []
    }

    try {
      // Try to parse the response directly first
      parsedResponse = JSON.parse(responseContent)
    } catch (parseError) {
      console.error("Failed to parse response directly:", parseError)

      // Log detailed parsing error
      if (traceId) {
        await logAPIError(
          traceId,
          FoodIdentificationStep.OPENAI_VISION_RESPONSE,
          {
            message: "Failed to parse JSON response directly",
            error: parseError,
            responseContent
          }
        )
      }

      // Try to extract JSON from markdown or code blocks
      try {
        // Extract JSON from code blocks or plain JSON
        const jsonMatch =
          responseContent.match(/```json\s*([\s\S]*?)\s*```/) ||
          responseContent.match(/```\s*([\s\S]*?)\s*```/) ||
          responseContent.match(/{[\s\S]*?}/)

        if (jsonMatch) {
          const jsonString = jsonMatch[1] || jsonMatch[0]
          // Clean up any potential markdown or whitespace
          const cleanedString = jsonString
            .replace(/^```json\s*/, "")
            .replace(/\s*```$/, "")
            .trim()

          parsedResponse = JSON.parse(cleanedString)
        } else {
          throw new Error("Could not extract JSON from response")
        }
      } catch (extractError) {
        console.error("Failed to extract JSON from response:", extractError)

        if (traceId) {
          await logAPIError(
            traceId,
            FoodIdentificationStep.OPENAI_VISION_RESPONSE,
            {
              message: "Failed to extract and parse JSON from response",
              error: extractError,
              responseContent
            }
          )
        }

        // Use default empty response instead of throwing
        console.warn("Using default empty response due to parsing failure")
      }
    }

    // Ensure the response has the expected structure
    if (!parsedResponse.foodItems) parsedResponse.foodItems = []
    if (!parsedResponse.extractedText) parsedResponse.extractedText = []

    // Helper function to ensure food items are properly formatted
    const ensureFoodItem = (item: any): FoodItem => {
      return {
        name: typeof item.name === "string" ? item.name : "",
        confidence:
          typeof item.confidence === "number" && !isNaN(item.confidence)
            ? Math.min(Math.max(item.confidence, 0), 1) // Ensure confidence is between 0 and 1
            : 0 // Default to 0 if confidence is missing or invalid
      }
    }

    // Ensure each food item has a confidence score
    parsedResponse.foodItems = parsedResponse.foodItems
      .map(ensureFoodItem)
      .filter(item => item.name.trim() !== "") // Remove items with empty names

    const result: ActionState<ImageProcessingResult> = {
      isSuccess: true,
      message: "Image processed successfully",
      data: parsedResponse
    }

    return result
  } catch (error) {
    console.error("Error processing image with OpenAI:", error)

    // Log the error if traceId is provided
    if (traceId) {
      await logAPIError(
        traceId,
        FoodIdentificationStep.OPENAI_VISION_RESPONSE,
        error
      )
    }

    return {
      isSuccess: false,
      message: `Failed to process image: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * Processes an image using OpenAI Vision API with improved structured output handling.
 * This function uses a structured prompt to generate consistent JSON output without using
 * the schema parameter which is not supported in OpenAI SDK 4.85.4.
 *
 * @param imageBase64 - Base64 encoded image data
 * @returns A promise resolving to an ActionState with food detection results
 */
export async function processImageAction(imageBase64: string): Promise<
  ActionState<{
    foodItems: { name: string; confidence: number }[]
    foodItemCount: number
    extractedText: string[]
    extractedTextCount: number
    success: boolean
    message: string
  }>
> {
  try {
    const session = await auth()
    if (!session?.userId) {
      return {
        isSuccess: false,
        message: "Authentication required"
      }
    }

    // Use a specific system prompt that forces structured output
    // without relying on the schema parameter
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a food identification assistant. Your task is to identify food items in images
          and extract any visible text. Always respond with a JSON object that has exactly this structure:
          {
            "foodItems": [
              { "name": "Food Item Name", "confidence": 0.95 }
            ],
            "extractedText": [
              "Line of text 1"
            ]
          }
          
          If no food items are detected, return an empty array for foodItems.
          If no text is detected, return an empty array for extractedText.
          Always include the confidence score as a number between 0 and 1.
          Always capitalize the first letter of each food item name.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Identify all food items in this image with confidence scores. Also extract any visible text."
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
            }
          ]
        }
      ]
    })

    // Get the response content with proper null check
    const responseContent = response.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error("No response content from OpenAI")
    }

    // Parse the JSON response
    const responseData = JSON.parse(responseContent)

    // Ensure the response has the expected structure with default values
    const foodItems = Array.isArray(responseData.foodItems)
      ? responseData.foodItems
      : []
    const extractedText = Array.isArray(responseData.extractedText)
      ? responseData.extractedText
      : []

    return {
      isSuccess: true,
      message: "Image processed successfully",
      data: {
        foodItems: foodItems,
        foodItemCount: foodItems.length,
        extractedText: extractedText,
        extractedTextCount: extractedText.length,
        success: true,
        message: "Food items detected successfully"
      }
    }
  } catch (error) {
    console.error("Error processing image:", error)
    return {
      isSuccess: false,
      message: `Failed to process image: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}
