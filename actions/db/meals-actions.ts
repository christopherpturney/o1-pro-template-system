/**
 * @description
 * Server actions for managing meals in the database.
 * Provides CRUD operations for meal records with proper error handling and type safety.
 * 
 * Key features:
 * - Create new meal records with associated metadata
 * - Retrieve meals by user ID with optional filtering
 * - Update existing meal records
 * - Delete meal records (with cascade delete for food items)
 * 
 * @dependencies
 * - Drizzle ORM: Database operations
 * - Clerk: Authentication
 * - ActionState: Response type pattern
 * 
 * @notes
 * - All dates are handled as ISO strings for consistency
 * - Meals are always associated with a user ID
 * - Total calories are stored at the meal level for quick access
 * - Proper error handling and logging is implemented for all operations
 */

"use server"

import { db } from "@/db/db"
import { InsertMeal, mealsTable, SelectMeal } from "@/db/schema"
import { ActionState } from "@/types"
import { auth } from "@clerk/nextjs/server"
import { and, asc, desc, eq, gte, lte } from "drizzle-orm"

/**
 * Creates a new meal record in the database.
 * 
 * @param meal - The meal data to insert
 * @returns ActionState with the created meal or error message
 */
export async function createMealAction(
  meal: InsertMeal
): Promise<ActionState<SelectMeal>> {
  try {
    const session = await auth()
    if (!session?.userId) {
      return { isSuccess: false, message: "Unauthorized" }
    }

    // Ensure the meal belongs to the authenticated user
    if (meal.userId !== session.userId) {
      return { isSuccess: false, message: "Invalid user ID" }
    }

    const [newMeal] = await db.insert(mealsTable).values(meal).returning()

    return {
      isSuccess: true,
      message: "Meal created successfully",
      data: newMeal
    }
  } catch (error) {
    console.error("Error creating meal:", error)
    return { isSuccess: false, message: "Failed to create meal" }
  }
}

/**
 * Retrieves meals for a specific user with optional date range filtering.
 * 
 * @param userId - The ID of the user whose meals to retrieve
 * @param startDate - Optional start date for filtering (ISO string)
 * @param endDate - Optional end date for filtering (ISO string)
 * @returns ActionState with an array of meals or error message
 */
export async function getMealsByUserIdAction(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<ActionState<SelectMeal[]>> {
  try {
    const session = await auth()
    if (!session?.userId) {
      return { isSuccess: false, message: "Unauthorized" }
    }

    // Ensure the user is requesting their own meals
    if (userId !== session.userId) {
      return { isSuccess: false, message: "Invalid user ID" }
    }

    let query = db.query.meals.findMany({
      where: eq(mealsTable.userId, userId),
      orderBy: [desc(mealsTable.mealDate)]
    })

    // Add date range filtering if provided
    if (startDate && endDate) {
      query = db.query.meals.findMany({
        where: and(
          eq(mealsTable.userId, userId),
          gte(mealsTable.mealDate, new Date(startDate)),
          lte(mealsTable.mealDate, new Date(endDate))
        ),
        orderBy: [asc(mealsTable.mealDate)]
      })
    }

    const meals = await query

    return {
      isSuccess: true,
      message: "Meals retrieved successfully",
      data: meals
    }
  } catch (error) {
    console.error("Error getting meals:", error)
    return { isSuccess: false, message: "Failed to get meals" }
  }
}

/**
 * Updates an existing meal record.
 * 
 * @param id - The UUID of the meal to update
 * @param data - Partial meal data to update
 * @returns ActionState with the updated meal or error message
 */
export async function updateMealAction(
  id: string,
  data: Partial<InsertMeal>
): Promise<ActionState<SelectMeal>> {
  try {
    const session = await auth()
    if (!session?.userId) {
      return { isSuccess: false, message: "Unauthorized" }
    }

    // First check if the meal belongs to the authenticated user
    const existingMeal = await db.query.meals.findFirst({
      where: eq(mealsTable.id, id)
    })

    if (!existingMeal) {
      return { isSuccess: false, message: "Meal not found" }
    }

    if (existingMeal.userId !== session.userId) {
      return { isSuccess: false, message: "Unauthorized to update this meal" }
    }

    const [updatedMeal] = await db
      .update(mealsTable)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(mealsTable.id, id))
      .returning()

    return {
      isSuccess: true,
      message: "Meal updated successfully",
      data: updatedMeal
    }
  } catch (error) {
    console.error("Error updating meal:", error)
    return { isSuccess: false, message: "Failed to update meal" }
  }
}

/**
 * Deletes a meal record and its associated food items (via cascade).
 * 
 * @param id - The UUID of the meal to delete
 * @returns ActionState with void or error message
 */
export async function deleteMealAction(id: string): Promise<ActionState<void>> {
  try {
    const session = await auth()
    if (!session?.userId) {
      return { isSuccess: false, message: "Unauthorized" }
    }

    // First check if the meal belongs to the authenticated user
    const existingMeal = await db.query.meals.findFirst({
      where: eq(mealsTable.id, id)
    })

    if (!existingMeal) {
      return { isSuccess: false, message: "Meal not found" }
    }

    if (existingMeal.userId !== session.userId) {
      return { isSuccess: false, message: "Unauthorized to delete this meal" }
    }

    await db.delete(mealsTable).where(eq(mealsTable.id, id))

    return {
      isSuccess: true,
      message: "Meal deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting meal:", error)
    return { isSuccess: false, message: "Failed to delete meal" }
  }
}
