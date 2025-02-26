/**
 * @description
 * API route for accessing food identification logs.
 * Provides endpoints to:
 * - Get all logs
 * - Get logs for a specific trace ID
 * - Post new logs from client components
 */

import {
  serverLogs,
  getAllTraces,
  getLogsByTraceId,
  addServerLog
} from "@/lib/server-logger"
import { NextResponse } from "next/server"

/**
 * GET handler for retrieving logs
 * - If traceId is provided as query param, returns logs for that trace
 * - Otherwise returns all logs and processed trace information
 */
export async function GET(request: Request) {
  console.log("GET /api/debug/logs called")

  try {
    // Log request headers for debugging
    console.log(
      "Request headers:",
      Object.fromEntries(request.headers.entries())
    )

    // Get URL and parse query parameters
    const url = new URL(request.url)
    const traceId = url.searchParams.get("traceId")
    console.log(`Trace ID from query: ${traceId || "none"}`)
    console.log(`Server logs count: ${serverLogs.length}`)

    // Set up headers for the response to prevent caching
    const headers = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0"
    })

    // If traceId is provided, return logs for that trace
    if (traceId) {
      console.log(`Returning logs for trace ID: ${traceId}`)
      const logs = getLogsByTraceId(traceId)
      console.log(`Found ${logs.length} logs for trace ID ${traceId}`)
      return NextResponse.json(
        {
          success: true,
          logs
        },
        { headers }
      )
    }

    // Otherwise return all traces (processed summary)
    console.log("Returning all traces")
    const traces = getAllTraces()
    console.log(`Found ${traces.length} unique traces`)

    // Log some sample data to verify it's working
    if (serverLogs.length > 0) {
      console.log("Sample log entry:", JSON.stringify(serverLogs[0]))
    }

    return NextResponse.json(
      {
        success: true,
        traces,
        logs: serverLogs
      },
      { headers }
    )
  } catch (error) {
    console.error("Error in GET /api/debug/logs:", error)
    return NextResponse.json(
      { success: false, error: "Error retrieving logs" },
      { status: 500 }
    )
  }
}

/**
 * POST handler for adding new logs from client components
 */
export async function POST(request: Request) {
  console.log("POST /api/debug/logs called")

  try {
    // Log request headers for debugging
    console.log(
      "Request headers:",
      Object.fromEntries(request.headers.entries())
    )

    // Clone the request for debugging in case we need to inspect it multiple times
    const requestClone = request.clone()

    // Parse the request body to get the log entry
    let logEntry
    try {
      logEntry = await request.json()
      console.log("Received log entry:", JSON.stringify(logEntry))
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)

      // Try to get the raw body for debugging
      const rawBody = await requestClone.text()
      console.error("Raw request body:", rawBody)

      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 }
      )
    }

    // Ensure the log entry has required fields
    if (!logEntry.traceId || !logEntry.step || !logEntry.timestamp) {
      console.error("Invalid log entry - missing required fields:", logEntry)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid log entry - missing required fields"
        },
        { status: 400 }
      )
    }

    // Add the log entry to the server-side logs
    addServerLog(logEntry)
    console.log(
      `Successfully added log to server. Total logs: ${serverLogs.length}`
    )

    // Return success response
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error adding log:", error)
    return NextResponse.json(
      { success: false, error: "Failed to add log entry" },
      { status: 500 }
    )
  }
}

/**
 * DELETE handler for clearing all logs (for testing purposes only)
 */
export async function DELETE(request: Request) {
  console.log("DELETE /api/debug/logs called - clearing all logs")

  try {
    // Clear the server logs array
    const logCount = serverLogs.length
    serverLogs.length = 0

    console.log(`Cleared ${logCount} logs from server`)

    // Set headers to prevent caching
    const headers = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0"
    })

    return NextResponse.json(
      {
        success: true,
        message: `Cleared ${logCount} logs`
      },
      { headers }
    )
  } catch (error) {
    console.error("Error clearing logs:", error)
    return NextResponse.json(
      { success: false, error: "Failed to clear logs" },
      { status: 500 }
    )
  }
}
