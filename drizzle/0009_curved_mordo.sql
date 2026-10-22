ALTER TABLE "db_pxl8r_cells" ADD COLUMN "timer_elapsed_seconds" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "db_pxl8r_cells" ADD COLUMN "rating" smallint;--> statement-breakpoint
ALTER TABLE "db_pxl8r_cells" ADD CONSTRAINT "rating_range" CHECK ("db_pxl8r_cells"."rating" BETWEEN 1 AND 5);