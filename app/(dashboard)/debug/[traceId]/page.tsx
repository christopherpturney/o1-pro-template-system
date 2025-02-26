"use client"

/**
 * @description
 * Debug detail page for viewing logs for a specific trace ID.
 * Shows a timeline view of all events in the food identification process.
 *
 * Features:
 * - Timeline view of all events in the trace
 * - Detailed information for each log entry
 * - Filtering by step type
 * - Back button to return to the trace list
 */

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { FoodIdentificationStep } from "@/lib/food-logger"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Info
} from "lucide-react"
import { use } from "react"

interface TraceDetailPageProps {
  params: Promise<{
    traceId: string
  }>
}

export default function TraceDetailPage({ params }: TraceDetailPageProps) {
  const { traceId } = use(params)
  const router = useRouter()
  const [logs, setLogs] = useState<any[]>([])
  const [filteredLogs, setFilteredLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({})
  const [stepFilter, setStepFilter] = useState<FoodIdentificationStep | "ALL">(
    "ALL"
  )

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true)

  // Fetch logs from API
  const fetchLogs = async () => {
    console.log("Fetching logs for trace:", traceId)
    setIsLoading(true)
    try {
      // Use specific traceId endpoint
      const response = await fetch(`/api/debug/logs?traceId=${traceId}`)
      const data = await response.json()

      if (!isMounted.current) return

      // Use the logs returned for this specific trace
      const traceLogs = data.logs || []
      setLogs(traceLogs)
      applyFilters(traceLogs)
    } catch (error) {
      console.error("Error fetching logs:", error)
    } finally {
      if (isMounted.current) {
        setIsLoading(false)
      }
    }
  }

  // Apply filters to logs
  const applyFilters = (logsToFilter = logs) => {
    let filtered = [...logsToFilter]

    if (stepFilter !== "ALL") {
      filtered = filtered.filter(log => log.step === stepFilter)
    }

    // Sort by timestamp
    filtered = filtered.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    setFilteredLogs(filtered)
  }

  // Toggle expanded state for a log
  const toggleExpanded = (index: number) => {
    setExpandedLogs(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  // Reset filters
  const resetFilters = () => {
    setStepFilter("ALL")
    applyFilters(logs)
  }

  // Go back to trace list
  const goBack = () => {
    router.push("/debug")
  }

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  // Format data for display
  const formatData = (data: any): string => {
    try {
      return JSON.stringify(data, null, 2)
    } catch (error) {
      return String(data)
    }
  }

  // Get color for step
  const getStepColor = (step: FoodIdentificationStep) => {
    const colorMap: Record<FoodIdentificationStep, string> = {
      [FoodIdentificationStep.IMAGE_UPLOAD]: "bg-blue-500",
      [FoodIdentificationStep.OPENAI_VISION_REQUEST]: "bg-purple-500",
      [FoodIdentificationStep.OPENAI_VISION_RESPONSE]: "bg-purple-700",
      [FoodIdentificationStep.NUTRITION_API_REQUEST]: "bg-green-500",
      [FoodIdentificationStep.NUTRITION_API_RESPONSE]: "bg-green-700",
      [FoodIdentificationStep.FINAL_FOOD_ITEM]: "bg-amber-500"
    }

    return colorMap[step] || "bg-gray-500"
  }

  // Effect for cleanup on unmount
  useEffect(() => {
    console.log("Component mounted with traceId:", traceId)

    // Set up mount state
    isMounted.current = true

    // Single fetch on mount/traceId change
    fetchLogs()

    // Cleanup function
    return () => {
      console.log("Component unmounting")
      isMounted.current = false
    }
  }, [traceId])

  // Effect to reapply filters when they change
  useEffect(() => {
    if (stepFilter !== "ALL") {
      console.log("Applying filter:", stepFilter)
    }
    applyFilters()
  }, [stepFilter])

  const handleRefreshClick = () => {
    console.log("Manual refresh clicked")
    fetchLogs()
  }

  return (
    <div className="container space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goBack}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="size-4" />
            Back to Traces
          </Button>

          <h1 className="text-xl font-bold">Trace Details</h1>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleRefreshClick}
          className="flex items-center gap-1"
        >
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </div>

      <div className="text-muted-foreground break-all font-mono text-sm">
        {traceId}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="min-w-[200px] flex-1">
              <label className="mb-1 block text-sm font-medium">
                Filter by Step
              </label>
              <select
                value={stepFilter}
                onChange={e =>
                  setStepFilter(
                    e.target.value as FoodIdentificationStep | "ALL"
                  )
                }
                className="h-10 w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="ALL">All Steps</option>
                {Object.values(FoodIdentificationStep).map(step => (
                  <option key={step} value={step}>
                    {step}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={resetFilters}
                className="h-10"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline View */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Timeline View</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && logs.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              Loading logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              {stepFilter === "ALL"
                ? "No logs available for this trace."
                : "No logs match your filter"}
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="bg-muted-foreground/20 absolute inset-y-0 left-[24px] w-0.5"></div>

              {/* Timeline events */}
              <div className="space-y-4">
                {filteredLogs.map((log, index) => (
                  <div key={index} className="relative ml-12">
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-[-24px] flex size-6 items-center justify-center rounded-full ${getStepColor(log.step)}`}
                    >
                      <Info className="size-3 text-white" />
                    </div>

                    {/* Event content */}
                    <div className="rounded-md border p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant="outline">{log.step}</Badge>
                          <div className="mt-1 text-sm font-medium">
                            {log.message}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {formatTimestamp(log.timestamp)}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(index)}
                        >
                          {expandedLogs[index] ? (
                            <ChevronUp className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                        </Button>
                      </div>

                      {expandedLogs[index] && log.data && (
                        <div className="mt-3 border-t pt-3">
                          <pre className="bg-muted/50 max-h-60 overflow-x-auto rounded-md p-2 font-mono text-xs">
                            {formatData(log.data)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
