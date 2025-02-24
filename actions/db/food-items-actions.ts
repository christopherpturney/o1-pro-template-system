/*
 * Server actions for managing food items in the database.
 *
 * These actions handle CRUD operations for food items within meals, including:
 * - Creating new food items
 * - Retrieving food items by meal ID
 * - Updating existing food items
 * - Deleting food items
 *
 * @dependencies
 * - db: Database client from @/db/db
 * - foodItemsTable: Schema from @/db/schema
 * - ActionState: Type from @/types
 *
 * @notes
 * - All actions use proper error handling
 * - Actions follow CRUD order
 * - Nutritional values use numeric type with precision
 * - Foreign key constraints are handled automatically by the database
 */

"use server"

import { db } from "@/db/db"
import { InsertFoodItem, SelectFoodItem, foodItemsTable } from "@/db/schema"
import { ActionState } from "@/types"
import { eq } from "drizzle-orm"

/**
 * Creates a new food item in the database.
 *
 * @param data - The food item data to insert
 * @returns Promise<ActionState<SelectFoodItem>> - The created food item or error
 */
export async function createFoodItemAction(
  data: InsertFoodItem
): Promise<ActionState<SelectFoodItem>> {
  try {
    const [newFoodItem] = await db.insert(foodItemsTable).values(data).returning()
    return {
      isSuccess: true,
      message: "Food item created successfully",
      data: newFoodItem
    }
  } catch (error) {
    console.error("Error creating food item:", error)
    return { isSuccess: false, message: "Failed to create food item" }
  }
}

/**
 * Retrieves all food items for a specific meal.
 *
 * @param mealId - The UUID of the meal to get food items for
 * @returns Promise<ActionState<SelectFoodItem[]>> - Array of food items or error
 */
export async function getFoodItemsByMealIdAction(
  mealId: string
): Promise<ActionState<SelectFoodItem[]>> {
  try {
    const foodItems = await db.query.foodItems.findMany({
      where: eq(foodItemsTable.mealId, mealId)
    })
    return {
      isSuccess: true,
      message: "Food items retrieved successfully",
      data: foodItems
    }
  } catch (error) {
    console.error("Error getting food items by meal id:", error)
    return { isSuccess: false, message: "Failed to get food items" }
  }
}

/**
 * Updates an existing food item.
 *
 * @param id - The UUID of the food item to update
 * @param data - The food item data to update
 * @returns Promise<ActionState<SelectFoodItem>> - The updated food item or error
 */
export async function updateFoodItemAction(
  id: string,
  data: Partial<InsertFoodItem>
): Promise<ActionState<SelectFoodItem>> {
  try {
    const [updatedFoodItem] = await db
      .update(foodItemsTable)
      .set(data)
      .where(eq(foodItemsTable.id, id))
      .returning()

    if (!updatedFoodItem) {
      return { isSuccess: false, message: "Food item not found to update" }
    }

    return {
      isSuccess: true,
      message: "Food item updated successfully",
      data: updatedFoodItem
    }
  } catch (error) {
    console.error("Error updating food item:", error)
    return { isSuccess: false, message: "Failed to update food item" }
  }
}

/**
 * Deletes a food item from the database.
 *
 * @param id - The UUID of the food item to delete
 * @returns Promise<ActionState<void>> - Success/failure status
 */
export async function deleteFoodItemAction(
  id: string
): Promise<ActionState<void>> {
  try {
    await db.delete(foodItemsTable).where(eq(foodItemsTable.id, id))
    return {
      isSuccess: true,
      message: "Food item deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting food item:", error)
    return { isSuccess: false, message: "Failed to delete food item" }
  }
}
