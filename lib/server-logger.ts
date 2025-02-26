/**
 * Server-side Food Identification Logger
 *
 * A server-side implementation of the food identification logger
 * that can be accessed by API routes and server components.
 */

import { FoodIdentificationStep } from "./logger"

// Simple log entry interface
export interface LogEntry {
  timestamp: string
  traceId: string
  step: FoodIdentificationStep
  message: string
  level?: string
  data?: any
}

// Server-side in-memory store for logs
export const serverLogs: LogEntry[] = []

// Sample logs are commented out to avoid confusion with real logs
// Uncomment these for testing if needed
/*
serverLogs.push({
  timestamp: new Date().toISOString(),
  traceId: "sample-trace-001",
  step: FoodIdentificationStep.IMAGE_UPLOAD,
  message: "Sample image upload",
  level: "info",
  data: { fileName: "test.jpg", fileSize: 1024 }
});

serverLogs.push({
  timestamp: new Date().toISOString(),
  traceId: "sample-trace-001",
  step: FoodIdentificationStep.OPENAI_VISION_REQUEST,
  message: "Sample OpenAI vision request",
  level: "info",
  data: { imageSize: 1024 }
});

serverLogs.push({
  timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  traceId: "sample-trace-002",
  step: FoodIdentificationStep.NUTRITION_API_REQUEST,
  message: "Sample nutrition API request",
  level: "info",
  data: { foodItems: [{ name: "Apple" }] }
});
*/

/**
 * Add a log entry to the server-side logs
 * This is used by API routes to record logs
 */
export function addServerLog(logEntry: LogEntry) {
  console.log(
    `[SERVER-LOGGER] Adding log entry: ${logEntry.step} - ${logEntry.message} for trace ${logEntry.traceId}`
  )
  serverLogs.push(logEntry)
  console.log(`[SERVER-LOGGER] Total logs now: ${serverLogs.length}`)
  return logEntry
}

/**
 * Get all unique trace IDs with their first and last timestamps
 * @returns Array of trace objects with id and timestamp information
 */
export function getAllTraces() {
  // Get unique trace IDs
  const traceIds = Array.from(new Set(serverLogs.map(log => log.traceId)))
  console.log(
    `[SERVER-LOGGER] Found ${traceIds.length} unique trace IDs:`,
    traceIds
  )

  // Map trace IDs to trace objects with more information
  const traces = traceIds.map(traceId => {
    // Get all logs for this trace
    const traceLogs = serverLogs.filter(log => log.traceId === traceId)

    // Find first and last timestamp
    const timestamps = traceLogs.map(log => new Date(log.timestamp).getTime())
    const firstTimestamp = new Date(Math.min(...timestamps)).toISOString()
    const lastTimestamp = new Date(Math.max(...timestamps)).toISOString()

    // Check if there are any error logs
    const hasErrors = traceLogs.some(log => log.level === "error")

    // Count different steps
    const stepCount = traceLogs.length

    // Log this trace for debugging
    console.log(
      `[SERVER-LOGGER] Trace ${traceId}: ${stepCount} steps, hasErrors: ${hasErrors}, first: ${firstTimestamp}, last: ${lastTimestamp}`
    )

    return {
      traceId,
      firstTimestamp,
      lastTimestamp,
      hasErrors,
      stepCount
    }
  })

  // Sort traces by last timestamp (newest first)
  traces.sort(
    (a, b) =>
      new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
  )

  return traces
}

/**
 * Get all logs for a specific trace ID
 * @param traceId The trace ID to filter by
 * @returns Array of logs for the trace ID
 */
export function getLogsByTraceId(traceId: string): LogEntry[] {
  console.log(`[SERVER-LOGGER] Getting logs for trace ID: ${traceId}`)
  const logs = serverLogs.filter(log => log.traceId === traceId)
  console.log(
    `[SERVER-LOGGER] Found ${logs.length} logs for trace ID: ${traceId}`
  )
  return logs
}
