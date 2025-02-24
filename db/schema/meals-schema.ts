/*
 * Defines the database schema for meals.
 *
 * This schema represents a meal logged by a user, including:
 * - Basic meal information (date, total calories)
 * - Foreign key relationship to the user's profile
 * - Automatic timestamp handling
 *
 * @dependencies
 * - profiles-schema.ts: For foreign key relationship
 *
 * @notes
 * - Uses UUID for primary key as per project standards
 * - Includes created_at and updated_at timestamps
 * - Foreign key to profiles table with cascade delete
 */

import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { profilesTable } from "./profiles-schema"

export const mealsTable = pgTable("meals", {
  // Primary key using UUID
  id: uuid("id").defaultRandom().primaryKey(),

  // Foreign key to profiles table
  userId: text("user_id")
    .notNull()
    .references(() => profilesTable.userId, { onDelete: "cascade" }),

  // Meal information
  mealDate: timestamp("meal_date").notNull(),
  totalCalories: integer("total_calories").notNull(),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

// Type definitions for insert and select operations
export type InsertMeal = typeof mealsTable.$inferInsert
export type SelectMeal = typeof mealsTable.$inferSelect
