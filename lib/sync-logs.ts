/**
 * @description
 * Utility to help ensure synchronized logging between client and server.
 * Exports a function to check and ensure the syncAllLogsToServer function
 * is available on the window object.
 */

"use client"

import { syncAllLogsToServer } from "./logger"

/**
 * Ensures the syncAllLogsToServer function is available on the window object
 * This is useful for debugging and manual triggering of log synchronization
 *
 * @returns True if the function was successfully exposed, false otherwise
 */
export function ensureSyncFunctionAvailable(): boolean {
  if (typeof window === "undefined") {
    return false // Not in a browser environment
  }

  try {
    // First check if it's already available
    if (typeof (window as any).syncAllLogsToServer === "function") {
      console.log(
        "syncAllLogsToServer function already available on window object"
      )
      return true
    }

    // If not, add it
    ;(window as any).syncAllLogsToServer = syncAllLogsToServer
    console.log("syncAllLogsToServer function now exposed to window object")
    return true
  } catch (error) {
    console.error("Failed to expose syncAllLogsToServer to window:", error)
    return false
  }
}

/**
 * Triggers the sync of all client logs to the server
 * @param fetchTracesCallback Optional callback to fetch traces after sync
 * @returns Promise that resolves to a boolean indicating success or failure
 */
export async function triggerLogSync(
  fetchTracesCallback?: () => Promise<void>
): Promise<boolean> {
  console.log("[SYNC-LOGS] Triggering log sync...")

  try {
    // Ensure the sync function is available first
    try {
      await ensureSyncFunctionAvailable()
    } catch (error) {
      console.error(
        "[SYNC-LOGS] Failed to ensure sync function available:",
        error
      )
      return false
    }

    // Check if the sync function is available
    if (typeof (window as any).syncAllLogsToServer === "function") {
      console.log(
        "[SYNC-LOGS] Found syncAllLogsToServer function, calling it now..."
      )

      try {
        await (window as any).syncAllLogsToServer()
        console.log("[SYNC-LOGS] Log sync completed successfully")

        // If a callback was provided, call it to fetch the updated traces
        if (typeof fetchTracesCallback === "function") {
          console.log(
            "[SYNC-LOGS] Calling fetchTracesCallback to refresh data..."
          )
          await fetchTracesCallback()
        }

        return true
      } catch (syncError) {
        console.error("[SYNC-LOGS] Error during log sync:", syncError)
        return false
      }
    } else {
      console.error(
        "[SYNC-LOGS] syncAllLogsToServer function not found on window object"
      )
      return false
    }
  } catch (error) {
    console.error("[SYNC-LOGS] Unexpected error in triggerLogSync:", error)
    return false
  }
}
