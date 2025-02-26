/**
 * Food Identification Logger
 *
 * A simplified logging utility for tracking the food identification process
 * from image upload to nutrition lookup.
 */

"use client"

import { v4 as uuidv4 } from "uuid"

// Define the steps in the food identification process
export enum FoodIdentificationStep {
  IMAGE_UPLOAD = "IMAGE_UPLOAD",
  OPENAI_VISION_REQUEST = "OPENAI_VISION_REQUEST",
  OPENAI_VISION_RESPONSE = "OPENAI_VISION_RESPONSE",
  NUTRITION_API_REQUEST = "NUTRITION_API_REQUEST",
  NUTRITION_API_RESPONSE = "NUTRITION_API_RESPONSE",
  FINAL_FOOD_ITEM = "FINAL_FOOD_ITEM"
}

// Simple log entry interface
interface LogEntry {
  timestamp: string
  traceId: string
  step: FoodIdentificationStep
  message: string
  data?: any
}

// In-memory store for logs (in a real app, this would go to a database or monitoring service)
export const logs: LogEntry[] = []

/**
 * Send a log entry to the server
 * This function sends the log to the server via a POST request to the API
 */
async function sendLogToServer(logEntry: LogEntry) {
  try {
    await fetch("/api/debug/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(logEntry)
    })
  } catch (error) {
    console.error("Failed to send log to server:", error)
    // Continue even if sending to server fails
  }
}

/**
 * Get all unique trace IDs with their first and last timestamps
 * @returns Array of trace objects with id and timestamp information
 */
export function getAllTraces() {
  // Get unique trace IDs
  const traceIds = Array.from(new Set(logs.map(log => log.traceId)))

  // For each trace ID, get the first and last timestamps
  return traceIds
    .map(traceId => {
      const traceLogs = logs.filter(log => log.traceId === traceId)
      const sortedLogs = [...traceLogs].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )

      return {
        traceId,
        firstTimestamp: sortedLogs[0]?.timestamp,
        lastTimestamp: sortedLogs[sortedLogs.length - 1]?.timestamp,
        stepCount: traceLogs.length,
        hasErrors: traceLogs.some(
          log => log.message.includes("Error") || log.data?.message
        )
      }
    })
    .sort(
      (a, b) =>
        // Sort by most recent first
        new Date(b.lastTimestamp).getTime() -
        new Date(a.lastTimestamp).getTime()
    )
}

/**
 * Get all logs for a specific trace ID
 * @param traceId The trace ID to filter by
 * @returns Array of logs for the trace ID
 */
export function getLogsByTraceId(traceId: string): LogEntry[] {
  return logs.filter(log => log.traceId === traceId)
}

/**
 * Create a food identification logger hook
 * This provides a consistent traceId and logging methods
 */
export function useFoodIdentificationLogger() {
  // Generate a trace ID for this identification session
  const traceId = uuidv4()

  // Log an entry
  const log = (step: FoodIdentificationStep, message: string, data?: any) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      traceId,
      step,
      message,
      data
    }

    console.log(`[${step}] ${message}`, entry)
    logs.push(entry)

    // Send log to server
    sendLogToServer(entry)

    return entry
  }

  // Log image upload
  const logImageUpload = (file: File, base64String: string) => {
    return log(FoodIdentificationStep.IMAGE_UPLOAD, "Image uploaded", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      base64Length: base64String.length
    })
  }

  // Log OpenAI Vision request
  const logOpenAIVisionRequest = (base64Image: string) => {
    return log(
      FoodIdentificationStep.OPENAI_VISION_REQUEST,
      "Sending request to OpenAI Vision API",
      {
        imageDataLength: base64Image.length
      }
    )
  }

  // Log OpenAI Vision response
  const logOpenAIVisionResponse = (response: any) => {
    return log(
      FoodIdentificationStep.OPENAI_VISION_RESPONSE,
      "Received response from OpenAI Vision API",
      {
        isSuccess: response.isSuccess,
        message: response.message,
        foodItemsCount: response.data?.foodItems?.length || 0,
        extractedTextCount: response.data?.extractedText?.length || 0
      }
    )
  }

  // Log Nutrition API request
  const logNutritionAPIRequest = (foodItems: any[]) => {
    return log(
      FoodIdentificationStep.NUTRITION_API_REQUEST,
      "Sending request to Nutrition API",
      {
        foodItems: foodItems.map(item => ({
          name: item.name,
          confidence: item.confidence
        }))
      }
    )
  }

  // Log Nutrition API response
  const logNutritionAPIResponse = (response: any) => {
    return log(
      FoodIdentificationStep.NUTRITION_API_RESPONSE,
      "Received response from Nutrition API",
      {
        isSuccess: response.isSuccess,
        message: response.message,
        resultCount: Object.keys(response.data || {}).length
      }
    )
  }

  // Log final food items
  const logFinalFoodItem = (foodItems: any[]) => {
    return log(
      FoodIdentificationStep.FINAL_FOOD_ITEM,
      "Final food items ready for display",
      {
        count: foodItems.length,
        items: foodItems.map(item => ({
          name: item.name,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          source: item.source,
          confidence: item.confidence
        }))
      }
    )
  }

  // Log an error
  const logError = (step: FoodIdentificationStep, error: any) => {
    return log(step, "Error occurred", {
      message: error.message || String(error),
      stack: error.stack
    })
  }

  // Get all logs for this trace ID
  const getLogs = () => {
    return logs.filter(entry => entry.traceId === traceId)
  }

  return {
    traceId,
    logImageUpload,
    logOpenAIVisionRequest,
    logOpenAIVisionResponse,
    logNutritionAPIRequest,
    logNutritionAPIResponse,
    logFinalFoodItem,
    logError,
    getLogs
  }
}
