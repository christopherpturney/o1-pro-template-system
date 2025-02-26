"use client"

/**
 * @description
 * Debug index page for viewing food identification traces.
 * This page displays a list of all available traces and allows
 * clicking into a specific trace to see its details.
 *
 * Features:
 * - List of all traces with timestamps
 * - Search filter for trace IDs
 * - Error indicators for traces with errors
 * - Click-through to detailed trace view
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Search, AlertCircle, ArrowRight, Clock } from "lucide-react"

export default function DebugIndexPage() {
  const router = useRouter()
  const [traces, setTraces] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Fetch traces from API
  const fetchTraces = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/debug/logs")
      const data = await response.json()

      if (data.traces) {
        // If the API returns processed traces directly, use those
        setTraces(data.traces)
      } else {
        // Fall back to processing logs if necessary
        const traceIds = Array.from<string>(
          new Set(data.logs.map((log: any) => log.traceId))
        )
        const processedTraces = traceIds
          .map((traceId: string) => {
            const traceLogs = data.logs.filter(
              (log: any) => log.traceId === traceId
            )
            const sortedLogs = [...traceLogs].sort(
              (a: any, b: any) =>
                new Date(a.timestamp).getTime() -
                new Date(b.timestamp).getTime()
            )

            return {
              traceId,
              firstTimestamp: sortedLogs[0]?.timestamp,
              lastTimestamp: sortedLogs[sortedLogs.length - 1]?.timestamp,
              stepCount: traceLogs.length,
              hasErrors: traceLogs.some(
                (log: any) => log.message.includes("Error") || log.data?.message
              )
            }
          })
          .sort(
            (a: any, b: any) =>
              new Date(b.lastTimestamp).getTime() -
              new Date(a.lastTimestamp).getTime()
          )

        setTraces(processedTraces)
      }
    } catch (error) {
      console.error("Error fetching traces:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter traces by search term
  const filteredTraces = traces.filter(trace =>
    trace.traceId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Navigate to trace detail page
  const viewTraceDetails = (traceId: string) => {
    router.push(`/debug/${traceId}`)
  }

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  // Calculate duration between first and last timestamps
  const calculateDuration = (firstTimestamp: string, lastTimestamp: string) => {
    const start = new Date(firstTimestamp).getTime()
    const end = new Date(lastTimestamp).getTime()
    const durationMs = end - start

    // Format as seconds if less than a minute
    if (durationMs < 60000) {
      return `${(durationMs / 1000).toFixed(2)}s`
    }

    // Format as minutes and seconds
    const minutes = Math.floor(durationMs / 60000)
    const seconds = ((durationMs % 60000) / 1000).toFixed(0)
    return `${minutes}m ${seconds}s`
  }

  // Fetch traces on mount and set up polling
  useEffect(() => {
    console.log("Debug index page mounted - fetching traces")
    fetchTraces()

    // No polling anymore - removed the interval
    // Only fetch on mount or manual refresh

    return () => {
      console.log("Debug index page unmounted")
    }
  }, [])

  return (
    <div className="container space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Food Identification Traces</h1>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchTraces}
          className="flex items-center gap-1"
        >
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </div>

      <p className="text-muted-foreground">
        Select a trace to view detailed logs for the food identification
        process.
      </p>

      {/* Search input */}
      <div className="relative">
        <Search className="text-muted-foreground absolute left-3 top-3 size-4" />
        <Input
          placeholder="Search traces by ID"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Traces list */}
      <div className="space-y-4">
        {isLoading && traces.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground py-8 text-center">
              Loading traces...
            </CardContent>
          </Card>
        ) : filteredTraces.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground py-8 text-center">
              {searchTerm
                ? "No traces match your search"
                : "No traces available. Try logging a meal first."}
            </CardContent>
          </Card>
        ) : (
          filteredTraces.map(trace => (
            <Card
              key={trace.traceId}
              className="hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => viewTraceDetails(trace.traceId)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="max-w-[200px] truncate font-mono text-sm sm:max-w-[300px] md:max-w-[500px]">
                        {trace.traceId}
                      </span>
                      {trace.hasErrors && (
                        <Badge
                          variant="destructive"
                          className="flex items-center gap-1"
                        >
                          <AlertCircle className="size-3" />
                          Error
                        </Badge>
                      )}
                    </div>

                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <Clock className="size-3" />
                      Started: {formatTimestamp(trace.firstTimestamp)}
                      {trace.firstTimestamp !== trace.lastTimestamp && (
                        <span>
                          • Duration:{" "}
                          {calculateDuration(
                            trace.firstTimestamp,
                            trace.lastTimestamp
                          )}
                        </span>
                      )}
                    </div>

                    <div className="text-muted-foreground text-sm">
                      {trace.stepCount} steps recorded
                    </div>
                  </div>

                  <Button size="sm" variant="ghost">
                    View Details
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
