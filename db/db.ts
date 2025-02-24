/*
 * Initializes the database connection and schema for the app.
 *
 * This file is responsible for:
 * - Setting up the database connection using postgres.js
 * - Configuring drizzle-orm with the complete schema
 * - Exporting the configured database client
 *
 * @dependencies
 * - postgres.js: For database connection
 * - drizzle-orm: For ORM functionality
 * - dotenv: For environment variable loading
 *
 * @notes
 * - Requires DATABASE_URL in .env.local
 * - Add new schemas to the schema object as they are created
 */

import { mealsTable, profilesTable } from "@/db/schema"
import { config } from "dotenv"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

// Load environment variables
config({ path: ".env.local" })

// Configure complete schema
const schema = {
  meals: mealsTable,
  profiles: profilesTable
}

// Initialize database client
const client = postgres(process.env.DATABASE_URL!)

// Export configured database instance
export const db = drizzle(client, { schema })
