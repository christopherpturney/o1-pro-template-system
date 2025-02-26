/**
 * @description
 * Logging utility for the food identification and nutrition data flow.
 * Provides structured logging for each step of the process from AI vision request to final display.
 *
 * Features:
 * - Unique trace ID for each food identification flow
 * - Structured log format with timestamps
 * - Support for various log levels (info, warn, error, debug)
 * - Object serialization for detailed debugging
 * - Conditional logging based on environment
 *
 * @dependencies
 * - None (pure utility)
 */

"use client"

import { useState, useEffect } from "react"

type LogLevel = "info" | "warn" | "error" | "debug"

export interface FoodIdentificationLog {
  traceId: string
  timestamp: string
  step: FoodIdentificationStep
  level: LogLevel
  message: string
  data?: any
}

// Food identification steps enum
export enum FoodIdentificationStep {
  IMAGE_UPLOAD = "IMAGE_UPLOAD",
  OPENAI_VISION_REQUEST = "OPENAI_VISION_REQUEST",
  OPENAI_VISION_RESPONSE = "OPENAI_VISION_RESPONSE",
  IMAGE_PROCESSING = "IMAGE_PROCESSING",
  NUTRITION_API_REQUEST = "NUTRITION_API_REQUEST",
  NUTRITION_API_RESPONSE = "NUTRITION_API_RESPONSE",
  FINAL_FOOD_ITEM = "FINAL_FOOD_ITEM"
}

// In-memory store for logs (persists client-side only)
const logs: FoodIdentificationLog[] = []

/**
 * Generate a unique trace ID for the logging session
 * Uses a timestamp and random string to ensure uniqueness
 *
 * @returns A unique trace ID string
 */
export function generateTraceId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Sync a log entry to the server-side logs via the API
 * @param log The log entry to sync
 */
async function syncLogToServer(log: FoodIdentificationLog): Promise<void> {
  try {
    // Only run in browser environment
    if (typeof window === "undefined") return

    console.log(
      `[CLIENT-LOGGER] Syncing log to server: ${log.step} - ${log.message}`
    )

    const response = await fetch("/api/debug/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(log)
    })

    if (!response.ok) {
      console.error(
        `[CLIENT-LOGGER] Server returned error status: ${response.status}`
      )
      const errorText = await response.text()
      console.error(`[CLIENT-LOGGER] Error response: ${errorText}`)
      return
    }

    const result = await response.json()

    if (result.success) {
      console.log(
        `[CLIENT-LOGGER] Successfully synced log to server: ${log.step}`
      )
    } else {
      console.error(
        `[CLIENT-LOGGER] Failed to sync log to server: ${result.error || "Unknown error"}`
      )
    }
  } catch (error) {
    console.error("[CLIENT-LOGGER] Error syncing log to server:", error)
  }
}

/**
 * Sync all client-side logs to the server
 */
export async function syncAllLogsToServer(): Promise<void> {
  try {
    // Only run in browser environment
    if (typeof window === "undefined") {
      console.log("[CLIENT-LOGGER] Not in browser environment, skipping sync")
      return
    }

    // Don't sync if there are no logs
    if (logs.length === 0) {
      console.log("[CLIENT-LOGGER] No logs to sync to server")
      return
    }

    console.log(
      `[CLIENT-LOGGER] Starting sync of ${logs.length} logs to server...`
    )

    // Send all logs in batches to avoid large payloads
    const batchSize = 10
    for (let i = 0; i < logs.length; i += batchSize) {
      const batch = logs.slice(i, i + batchSize)
      console.log(
        `[CLIENT-LOGGER] Syncing batch ${i / batchSize + 1} with ${batch.length} logs`
      )
      await Promise.all(batch.map(log => syncLogToServer(log)))
    }

    console.log("[CLIENT-LOGGER] All logs synced to server successfully")
  } catch (error) {
    console.error("[CLIENT-LOGGER] Error syncing all logs to server:", error)
  }
}

// After defining the function, now we can expose it to the window
if (typeof window !== "undefined") {
  ;(window as any).syncAllLogsToServer = syncAllLogsToServer
  console.log("Exposed syncAllLogsToServer to window object for debugging")
}

/**
 * Custom hook for food identification logging
 * Provides methods to log each step of the food identification process
 * Maintains a consistent trace ID throughout the process
 *
 * @returns Object with traceId and logging methods
 */
export function useFoodIdentificationLogger() {
  const [traceId, setTraceId] = useState<string>("")

  // Initialize traceId on mount or retrieve from sessionStorage
  useEffect(() => {
    // Check if we have an existing traceId in sessionStorage
    const existingTraceId =
      typeof window !== "undefined"
        ? sessionStorage.getItem("food_identification_trace_id")
        : null

    if (existingTraceId) {
      setTraceId(existingTraceId)
    } else {
      // Generate a new traceId and store it
      const newTraceId = generateTraceId()
      setTraceId(newTraceId)

      if (typeof window !== "undefined") {
        sessionStorage.setItem("food_identification_trace_id", newTraceId)
      }
    }

    // Sync any existing logs to the server
    syncAllLogsToServer()

    // Re-expose the function to window just to be safe
    if (typeof window !== "undefined") {
      ;(window as any).syncAllLogsToServer = syncAllLogsToServer
      console.log(
        "Re-exposed syncAllLogsToServer in logger hook initialization"
      )
    }
  }, [])

  return {
    traceId,

    // Log methods
    logImageUpload: (file: File, base64String: string) => {
      logAPIRequest(FoodIdentificationStep.IMAGE_UPLOAD, traceId, {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        imageSize: base64String.length
      })
    },

    logOpenAIVisionRequest: (base64Image: string) => {
      logOpenAIVisionRequest(traceId, base64Image)
    },

    logOpenAIVisionResponse: (response: any) => {
      logOpenAIVisionResponse(traceId, response)
    },

    logNutritionAPIRequest: (foodItems: any[]) => {
      logNutritionAPIRequest(traceId, foodItems)
    },

    logNutritionAPIResponse: (response: any) => {
      logNutritionAPIResponse(traceId, response)
    },

    logFinalFoodItem: (foodItems: any[]) => {
      logFinalFoodItem(traceId, foodItems)
    },

    logError: (step: FoodIdentificationStep, error: any) => {
      logAPIError(step, traceId, error)
    }
  }
}

/**
 * Log information about a step in the food identification process
 *
 * @param traceId - Unique identifier for the logging session
 * @param step - The step in the food identification process
 * @param level - Log level (info, warn, error, debug)
 * @param message - Human-readable message
 * @param data - Optional data to include in the log
 */
export function logFoodIdentification(
  traceId: string,
  step: FoodIdentificationStep,
  level: LogLevel,
  message: string,
  data?: any
): void {
  const log: FoodIdentificationLog = {
    traceId,
    timestamp: new Date().toISOString(),
    step,
    level,
    message,
    data: data ? JSON.parse(JSON.stringify(data)) : undefined
  }

  // Store in memory
  logs.push(log)

  // Sync log to server asynchronously
  syncLogToServer(log).catch(err =>
    console.error("Failed to sync log to server:", err)
  )

  // Also log to console for development
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[${log.timestamp}] [${traceId}] [${step}] [${level}] ${message}`
    )
    if (data) {
      console.log(JSON.stringify(data, null, 2))
    }
  }
}

/**
 * Get all logs for a specific trace ID
 *
 * @param traceId - Unique identifier for the logging session
 * @returns Array of logs for the trace ID
 */
export function getLogsByTraceId(traceId: string): FoodIdentificationLog[] {
  return logs.filter(log => log.traceId === traceId)
}

/**
 * Clear all logs (useful for tests or when memory usage is a concern)
 */
export function clearLogs(): void {
  logs.length = 0
}

/**
 * Export logs for a specific trace ID to JSON
 *
 * @param traceId - Unique identifier for the logging session
 * @returns JSON string of logs
 */
export function exportLogsToJson(traceId: string): string {
  const filteredLogs = getLogsByTraceId(traceId)
  return JSON.stringify(filteredLogs, null, 2)
}

// Log entry interface
export interface LogEntry {
  timestamp: string
  traceId: string
  step: FoodIdentificationStep
  data: any
  metadata?: Record<string, any>
}

// Function to log an API request to either OpenAI Vision or Nutrition API
export function logAPIRequest(
  step: FoodIdentificationStep,
  traceId: string,
  data: any,
  metadata?: Record<string, any>
): void {
  if (!traceId) return

  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    traceId,
    step,
    data,
    metadata
  }

  // Currently just logging to console, but this could be expanded to log to a database or monitoring service
  console.log(`[${step}] Request`, logEntry)
}

// Function to log an API response from either OpenAI Vision or Nutrition API
export function logAPIResponse(
  step: FoodIdentificationStep,
  traceId: string,
  data: any,
  metadata?: Record<string, any>
): void {
  if (!traceId) return

  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    traceId,
    step,
    data,
    metadata
  }

  // Currently just logging to console, but this could be expanded to log to a database or monitoring service
  console.log(`[${step}] Response`, logEntry)
}

// Function to log an API error
export function logAPIError(
  step: FoodIdentificationStep,
  traceId: string,
  error: any,
  metadata?: Record<string, any>
): void {
  if (!traceId) return

  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    traceId,
    step,
    data: {
      message: error?.message || "Unknown error",
      stack: error?.stack,
      name: error?.name
    },
    metadata
  }

  // Currently just logging to console, but this could be expanded to log to a database or monitoring service
  console.error(`[${step}] Error`, logEntry)
}

// Function to log OpenAI Vision request
export function logOpenAIVisionRequest(
  traceId: string,
  base64Image: string,
  metadata?: Record<string, any>
): void {
  if (!traceId) return

  // Don't log the full image data to avoid console flooding
  // Just log that an image was sent
  logAPIRequest(
    FoodIdentificationStep.OPENAI_VISION_REQUEST,
    traceId,
    { imageSize: base64Image.length },
    metadata
  )
}

// Function to log OpenAI Vision response
export function logOpenAIVisionResponse(
  traceId: string,
  response: any,
  metadata?: Record<string, any>
): void {
  if (!traceId) return

  logAPIResponse(
    FoodIdentificationStep.OPENAI_VISION_RESPONSE,
    traceId,
    response,
    metadata
  )
}

// Function to log Nutrition API request
export function logNutritionAPIRequest(
  traceId: string,
  foodItems: any[],
  metadata?: Record<string, any>
): void {
  if (!traceId) return

  logAPIRequest(
    FoodIdentificationStep.NUTRITION_API_REQUEST,
    traceId,
    { foodItems: foodItems.map(item => ({ name: item.name })) },
    metadata
  )
}

// Function to log Nutrition API response
export function logNutritionAPIResponse(
  traceId: string,
  response: any,
  metadata?: Record<string, any>
): void {
  if (!traceId) return

  logAPIResponse(
    FoodIdentificationStep.NUTRITION_API_RESPONSE,
    traceId,
    response,
    metadata
  )
}

// Function to log the final food item that will be displayed to the user
export function logFinalFoodItem(
  traceId: string,
  foodItems: any[],
  metadata?: Record<string, any>
): void {
  if (!traceId) return

  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    traceId,
    step: FoodIdentificationStep.FINAL_FOOD_ITEM,
    data: { foodItems },
    metadata
  }

  console.log(`[${FoodIdentificationStep.FINAL_FOOD_ITEM}]`, logEntry)
}
