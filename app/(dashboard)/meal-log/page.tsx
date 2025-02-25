"use server"

/**
 * @description
 * This page allows users to log meals by uploading food images for AI analysis,
 * editing detected food items, and saving meals to their history.
 *
 * It serves as a container for the MealLogForm client component, which handles
 * the interactive elements of meal logging.
 *
 * @dependencies
 * - MealLogForm: Client component for handling the meal logging workflow
 * - Suspense: For handling async data loading
 *
 * @notes
 * - No asynchronous data fetching is required directly in this page
 * - All interactive functionality is delegated to the client component
 * - Server component pattern used for better SEO and initial load performance
 */

import MealLogForm from "./_components/meal-log-form"

export default async function MealLogPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Log a Meal</h1>
          <p className="text-muted-foreground">
            Take a photo of your food or upload an image to identify items and
            track nutrition.
          </p>
        </div>

        <MealLogForm />
      </div>
    </div>
  )
}
