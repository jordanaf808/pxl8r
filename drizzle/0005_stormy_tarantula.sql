ALTER TABLE "db_pxl8r_cells" ADD COLUMN "timer_minutes" integer;--> statement-breakpoint
ALTER TABLE "db_pxl8r_cells" ADD COLUMN "timer_started_at" timestamp with time zone DEFAULT NULL;--> statement-breakpoint
ALTER TABLE "db_pxl8r_pixels" ADD COLUMN "is_active" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "db_pxl8r_users" ADD COLUMN "dark_mode" boolean DEFAULT false NOT NULL;