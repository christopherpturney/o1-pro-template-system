ALTER TABLE "food_items" ADD COLUMN "confidence" numeric(4, 3);--> statement-breakpoint
ALTER TABLE "food_items" ADD COLUMN "source" text;--> statement-breakpoint
ALTER TABLE "food_items" ADD COLUMN "source_id" text;