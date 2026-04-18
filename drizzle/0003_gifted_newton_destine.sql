ALTER TABLE "db_pxl8r_pixels" DROP CONSTRAINT "progress_range";--> statement-breakpoint
ALTER TABLE "db_pxl8r_cells" ALTER COLUMN "completed_at" SET DEFAULT NULL;--> statement-breakpoint
ALTER TABLE "db_pxl8r_cells" ADD COLUMN "progress" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "db_pxl8r_pixels" DROP COLUMN "completed_at";--> statement-breakpoint
ALTER TABLE "db_pxl8r_pixels" DROP COLUMN "progress";--> statement-breakpoint
ALTER TABLE "db_pxl8r_cells" ADD CONSTRAINT "progress_range" CHECK ("db_pxl8r_cells"."progress" >= 0 AND "db_pxl8r_cells"."progress" <= 100);