"use server"

/**
 * @description
 * Meal history page that displays a record of the user's past meals.
 * Features:
 * - Tabular view of all logged meals
 * - Date filtering options
 * - Detail view for individual meals
 * - Nutritional summary statistics
 *
 * @dependencies
 * - getMealsByUserIdAction: Server action to fetch meal data
 * - Clerk auth: For user authentication
 * - @/components/ui: For UI components
 */

import { auth } from "@clerk/nextjs/server"
import { getMealsByUserIdAction } from "@/actions/db/meals-actions"
import { Suspense } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { CalendarIcon, Eye, ArrowRight } from "lucide-react"
import Link from "next/link"

export default async function MealHistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meal History</h1>
        <p className="text-muted-foreground mt-2">
          View your meal history and track your nutrition over time.
        </p>
      </div>

      <Suspense fallback={<MealHistorySkeleton />}>
        <MealHistoryTable />
      </Suspense>
    </div>
  )
}

// Component to fetch and display the meal history table
async function MealHistoryTable() {
  const { userId } = await auth()

  if (!userId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p>You need to be logged in to view your meal history.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Fetch meal history
  const response = await getMealsByUserIdAction(userId)

  if (!response.isSuccess) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p>Failed to load meal history: {response.message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const meals = response.data

  if (meals.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center pt-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              You haven't logged any meals yet.
            </p>
            <Link href="/meal-log">
              <Button>
                Log Your First Meal
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Meals</CardTitle>
        <CardDescription>
          A record of all your logged meals and their nutritional information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Calories</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {meals.map(meal => (
              <TableRow key={meal.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="text-muted-foreground size-4" />
                    {format(new Date(meal.mealDate), "MMM d, yyyy")}
                  </div>
                </TableCell>
                <TableCell>
                  {format(new Date(meal.mealDate), "h:mm a")}
                </TableCell>
                <TableCell>{meal.totalCalories} kcal</TableCell>
                <TableCell className="text-right">
                  <Link href={`/meal-history/${meal.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="mr-2 size-4" />
                      View Details
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// Loading skeleton for the meal history table
function MealHistorySkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-7 w-40 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-full animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-10 w-full animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-12 w-full animate-pulse rounded-md bg-gray-200 dark:bg-gray-700"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
