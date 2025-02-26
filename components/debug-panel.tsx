"use client"

/**
 * @description
 * A debug panel component that displays traces from the food identification process.
 * This component shows detailed API calls, responses, and errors to help with debugging.
 *
 * Features:
 * - Collapsible sections for different trace steps
 * - Filter by trace ID or step type
 * - JSON formatting and syntax highlighting
 * - Timeline view of the food identification process
 *
 * @dependencies
 * - useFoodIdentificationLogger: For accessing the in-memory logs
 * - react-json-view: For JSON formatting and display
 */

import { useState, useEffect } from "react"
import {
  useFoodIdentificationLogger,
  FoodIdentificationStep,
  getLogsByTraceId
} from "@/lib/logger"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCw,
  AlertCircle,
  Info
} from "lucide-react"

// Define the structure for our console logs to parse
interface ConsoleLog {
  timestamp: string
  traceId: string
  step: FoodIdentificationStep
  level: "info" | "error" | "warn"
  message: string
  data: any
}

export default function DebugPanel() {
  const logger = useFoodIdentificationLogger()
  const [logs, setLogs] = useState<ConsoleLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<ConsoleLog[]>([])
  const [traceIdFilter, setTraceIdFilter] = useState("")
  const [stepFilter, setStepFilter] = useState<FoodIdentificationStep | "">("")
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState("timeline")

  // Function to fetch logs
  const fetchLogs = () => {
    // Get logs for the current trace ID
    const clientLogs = getLogsByTraceId(logger.traceId).map(log => ({
      timestamp: new Date(log.timestamp).toISOString(),
      traceId: log.traceId,
      step: log.step,
      level: (log.level === "debug" ? "info" : log.level) as
        | "info"
        | "error"
        | "warn",
      message: log.message,
      data: log.data
    }))

    // In a real app, you would fetch server logs from an API endpoint
    // For now, we'll just use the client logs
    setLogs(clientLogs)
    applyFilters(clientLogs)
  }

  // Apply filters to logs
  const applyFilters = (logsToFilter = logs) => {
    let filtered = [...logsToFilter]

    if (traceIdFilter) {
      filtered = filtered.filter(log => log.traceId.includes(traceIdFilter))
    }

    if (stepFilter) {
      filtered = filtered.filter(log => log.step === stepFilter)
    }

    setFilteredLogs(filtered)
  }

  // Toggle expanded state for a log
  const toggleExpanded = (index: number) => {
    const logId = `log-${index}`
    setExpandedLogs(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }))
  }

  // Reset filters
  const resetFilters = () => {
    setTraceIdFilter("")
    setStepFilter("")
    applyFilters(logs)
  }

  // Effect to fetch logs on mount and when logger changes
  useEffect(() => {
    fetchLogs()

    // Set up poll for new logs every 2 seconds
    const interval = setInterval(fetchLogs, 2000)

    return () => clearInterval(interval)
  }, [traceIdFilter, stepFilter])

  // Effect to reapply filters when they change
  useEffect(() => {
    applyFilters()
  }, [traceIdFilter, stepFilter])

  // Get unique trace IDs for filtering
  const uniqueTraceIds = Array.from(new Set(logs.map(log => log.traceId)))

  // Format raw data for display
  const formatDataOutput = (data: any): string => {
    try {
      return typeof data === "object"
        ? JSON.stringify(data, null, 2)
        : String(data)
    } catch (error) {
      return String(data)
    }
  }

  // Get color for step
  const getStepColor = (step: FoodIdentificationStep) => {
    const colorMap: Record<FoodIdentificationStep, string> = {
      [FoodIdentificationStep.IMAGE_UPLOAD]: "bg-indigo-500",
      [FoodIdentificationStep.OPENAI_VISION_REQUEST]: "bg-purple-500",
      [FoodIdentificationStep.OPENAI_VISION_RESPONSE]: "bg-purple-700",
      [FoodIdentificationStep.IMAGE_PROCESSING]: "bg-purple-700",
      [FoodIdentificationStep.NUTRITION_API_REQUEST]: "bg-green-500",
      [FoodIdentificationStep.NUTRITION_API_RESPONSE]: "bg-green-700",
      [FoodIdentificationStep.FINAL_FOOD_ITEM]: "bg-amber-500"
    }

    return colorMap[step] || "bg-gray-500"
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Food Identification Debug Panel</span>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchLogs}
            className="flex items-center gap-1"
          >
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="min-w-[200px] flex-1">
            <Label htmlFor="trace-id">Trace ID</Label>
            <Input
              id="trace-id"
              placeholder="Filter by trace ID"
              value={traceIdFilter}
              onChange={e => setTraceIdFilter(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="min-w-[200px] flex-1">
            <Label htmlFor="step-filter">Step</Label>
            <select
              id="step-filter"
              value={stepFilter}
              onChange={e =>
                setStepFilter(e.target.value as FoodIdentificationStep | "")
              }
              className="h-10 w-full rounded-md border px-3 py-2"
            >
              <option value="">All Steps</option>
              {Object.values(FoodIdentificationStep).map(step => (
                <option key={step} value={step}>
                  {step}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button variant="secondary" onClick={resetFilters} className="h-10">
              Reset Filters
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="timeline">Timeline View</TabsTrigger>
            <TabsTrigger value="raw">Raw Logs</TabsTrigger>
          </TabsList>

          {/* Timeline View */}
          <TabsContent value="timeline" className="mt-4">
            {filteredLogs.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                No logs to display. Try uploading an image to generate logs.
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
                        {log.level === "error" ? (
                          <AlertCircle className="size-3 text-white" />
                        ) : (
                          <Info className="size-3 text-white" />
                        )}
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
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpanded(index)}
                          >
                            {expandedLogs[`log-${index}`] ? (
                              <ChevronUp className="size-4" />
                            ) : (
                              <ChevronDown className="size-4" />
                            )}
                          </Button>
                        </div>

                        {/* Expanded content */}
                        {expandedLogs[`log-${index}`] && (
                          <div className="mt-2 border-t pt-2">
                            <div className="bg-muted max-h-[300px] overflow-auto rounded p-2 text-xs">
                              <pre>{formatDataOutput(log.data)}</pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Raw Logs */}
          <TabsContent value="raw" className="mt-4">
            {filteredLogs.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                No logs to display. Try refreshing or changing your filters.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLogs.map((log, index) => (
                  <div key={index} className="rounded-md border p-3">
                    <div className="flex justify-between">
                      <Badge
                        variant={
                          log.level === "error" ? "destructive" : "outline"
                        }
                      >
                        {log.step}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {new Date(log.timestamp).toLocaleString()}
                      </Badge>
                    </div>

                    <div className="mt-2 font-medium">{log.message}</div>

                    <div className="bg-muted mt-2 max-h-[200px] overflow-auto rounded p-2 text-xs">
                      <pre>{formatDataOutput(log.data)}</pre>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
