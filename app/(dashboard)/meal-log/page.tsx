"use server"

/**
 * @description
 * This server component serves as the meal logging page under the dashboard.
 * It renders a form for users to upload an image of their meal for logging.
 *
 * Key features:
 * - Simple Layout: Displays a title and the meal logging form
 * - Integration: Uses the dashboard layout for navigation consistency
 *
 * @dependencies
 * - "@/app/(dashboard)/meal-log/_components/meal-log-form": Client component for form handling
 *
 * @notes
 * - Marked as "use server" per project rules for server components
 * - No async operations yet (e.g., fetching meals), so no Suspense is needed
 * - Future steps will add AI processing and food item management
 */

import MealLogForm from "./_components/meal-log-form"

export default async function MealLogPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">Log a New Meal</h1>
      <MealLogForm />
    </div>
  )
}
