"use client"

/**
 * @description
 * Custom hook that provides a simple interface for logging food identification steps.
 * Maintains the trace ID throughout the component lifecycle.
 *
 * @dependencies
 * - React: For hooks
 * - lib/logger: For the logging functionality
 */

import { useCallback, useEffect, useState, useMemo } from "react"
import {
  FoodIdentificationStep,
  generateTraceId,
  logFoodIdentification,
  logAPIError,
  logFinalFoodItem as logFinalFoodItemFn,
  logNutritionAPIRequest as logNutritionAPIRequestFn,
  logNutritionAPIResponse as logNutritionAPIResponseFn,
  logOpenAIVisionRequest as logOpenAIVisionRequestFn,
  logOpenAIVisionResponse as logOpenAIVisionResponseFn
} from "@/lib/logger"
import { v4 as uuidv4 } from "uuid"

export function useFoodIdentificationLogger() {
  // Generate a unique trace ID for this identification process
  const traceId = useMemo(() => uuidv4(), [])

  // Log the initial usage of the logger
  useEffect(() => {
    logFoodIdentification(
      traceId,
      FoodIdentificationStep.IMAGE_UPLOAD,
      "info",
      "Food identification process started",
      { timestamp: new Date().toISOString() }
    )

    // Cleanup function to log when the component unmounts
    return () => {
      logFoodIdentification(
        traceId,
        FoodIdentificationStep.FINAL_FOOD_ITEM,
        "info",
        "Food identification process completed",
        { timestamp: new Date().toISOString() }
      )
    }
  }, [traceId])

  // Log image upload
  const logImageUpload = useCallback(
    (file: File, base64String: string) => {
      // We're using a custom step for image upload since it's not an API call
      console.log(`[${FoodIdentificationStep.IMAGE_UPLOAD}]`, {
        timestamp: new Date().toISOString(),
        traceId,
        step: FoodIdentificationStep.IMAGE_UPLOAD,
        data: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          base64Length: base64String.length
        }
      })
    },
    [traceId]
  )

  // Log OpenAI Vision request
  const logOpenAIVisionRequest = useCallback(
    (base64Image: string) => {
      logOpenAIVisionRequestFn(traceId, base64Image)
    },
    [traceId]
  )

  // Log OpenAI Vision response
  const logOpenAIVisionResponse = useCallback(
    (response: any) => {
      logOpenAIVisionResponseFn(traceId, response)
    },
    [traceId]
  )

  // Log nutrition API request
  const logNutritionAPIRequest = useCallback(
    (foodItems: any[]) => {
      logNutritionAPIRequestFn(traceId, foodItems)
    },
    [traceId]
  )

  // Log nutrition API response
  const logNutritionAPIResponse = useCallback(
    (response: any) => {
      logNutritionAPIResponseFn(traceId, response)
    },
    [traceId]
  )

  // Log final food item
  const logFinalFoodItem = useCallback(
    (foodItems: any[]) => {
      logFinalFoodItemFn(traceId, foodItems)
    },
    [traceId]
  )

  // Log an error
  const logError = useCallback(
    (step: FoodIdentificationStep, error: any) => {
      logAPIError(step, traceId, error)
    },
    [traceId]
  )

  return {
    traceId,
    logImageUpload,
    logOpenAIVisionRequest,
    logOpenAIVisionResponse,
    logNutritionAPIRequest,
    logNutritionAPIResponse,
    logFinalFoodItem,
    logError
  }
}
