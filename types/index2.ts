/*
 * Exports the types for the AI Food Identifier & Nutrition Tracker app.
 *
 * This file serves as the central export point for all TypeScript types,
 * ensuring type consistency and reusability across the application.
 *
 * @notes
 * - Add new type exports here as they are created
 * - Keep exports organized and documented
 */

export * from "./server-action-types"

// Type for temporary food items used during meal logging before saving to the database
export type TempFoodItem = {
  tempId: string // Unique identifier for temporary items, generated client-side (e.g., via crypto.randomUUID())
  name: string // Name of the food item, editable by the user
  calories?: number // Optional calories value, nullable until fetched or manually set
  fat?: number // Optional fat value in grams, nullable until fetched or manually set
  carbs?: number // Optional carbs value in grams, nullable until fetched or manually set
  protein?: number // Optional protein value in grams, nullable until fetched or manually set
  detectedViaAi: boolean // Indicates if the item was detected by AI, defaults to true for AI-detected items
}
