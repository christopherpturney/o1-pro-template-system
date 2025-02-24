/*
 * Defines the database schema for food items.
 *
 * This schema represents individual food items within a meal, including:
 * - Basic food information (name)
 * - Nutritional information (calories, fat, carbs, protein)
 * - AI detection tracking
 * - Foreign key relationship to the meal
 * - Automatic timestamp handling
 *
 * @dependencies
 * - meals-schema.ts: For foreign key relationship
 *
 * @notes
 * - Uses UUID for primary key as per project standards
 * - Nutritional values use numeric type with precision for accurate calculations
 * - All nutritional fields are nullable to handle cases where data is unavailable
 * - Foreign key to meals table with cascade delete
 * - Includes created_at and updated_at timestamps
 */

import {
  boolean,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid
} from "drizzle-orm/pg-core"
import { mealsTable } from "./meals-schema"

export const foodItemsTable = pgTable("food_items", {
  // Primary key using UUID
  id: uuid("id").defaultRandom().primaryKey(),

  // Foreign key to meals table
  mealId: uuid("meal_id")
    .notNull()
    .references(() => mealsTable.id, { onDelete: "cascade" }),

  // Food item information
  name: text("name").notNull(),

  // Nutritional information
  // Using numeric type with precision for accurate calculations
  // All fields are nullable as nutritional info might not always be available
  calories: numeric("calories", { precision: 10, scale: 2 }),
  fat: numeric("fat", { precision: 10, scale: 2 }),
  carbs: numeric("carbs", { precision: 10, scale: 2 }),
  protein: numeric("protein", { precision: 10, scale: 2 }),

  // AI detection tracking
  detectedViaAi: boolean("detected_via_ai").default(false).notNull(),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

// Type definitions for insert and select operations
export type InsertFoodItem = typeof foodItemsTable.$inferInsert
export type SelectFoodItem = typeof foodItemsTable.$inferSelect
