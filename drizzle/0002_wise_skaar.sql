CREATE TYPE "public"."color_type" AS ENUM('rust', 'sage', 'gold', 'slate', 'warm');--> statement-breakpoint
ALTER TABLE "db_pxl8r_grid_pixels" ALTER COLUMN "sort_order" SET DEFAULT 'alphabetic';--> statement-breakpoint
ALTER TABLE "db_pxl8r_pixels" ALTER COLUMN "color" SET DATA TYPE "public"."color_type" USING "color"::"public"."color_type";--> statement-breakpoint
ALTER TABLE "db_pxl8r_cells" ADD COLUMN "type" "cell_type" NOT NULL;