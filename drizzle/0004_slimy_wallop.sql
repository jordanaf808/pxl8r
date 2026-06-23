ALTER TYPE "public"."unit_type" ADD VALUE 'count' BEFORE 'percent';--> statement-breakpoint
ALTER TABLE "db_pxl8r_pixels" ADD COLUMN "timer_minutes" integer;