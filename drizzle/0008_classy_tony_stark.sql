ALTER TABLE "db_pxl8r_cells" RENAME COLUMN "col" TO "position";--> statement-breakpoint
ALTER TABLE "db_pxl8r_cells" DROP CONSTRAINT "db_pxl8r_cells_pixel_id_db_pxl8r_pixels_id_fk";
--> statement-breakpoint
DROP INDEX "cells_position_idx";--> statement-breakpoint
-- Hand-edited: remove cells that belong to no row, before pixel_id becomes NOT NULL and the composite FK is added.
DELETE FROM "db_pxl8r_cells" c
WHERE c.pixel_id IS NULL
   OR NOT EXISTS (
     SELECT 1 FROM "db_pxl8r_grid_pixels" gp
     WHERE gp.grid_id = c.grid_id AND gp.pixel_id = c.pixel_id
   );--> statement-breakpoint
ALTER TABLE "db_pxl8r_cells" ALTER COLUMN "owner_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "db_pxl8r_cells" ALTER COLUMN "pixel_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "db_pxl8r_pixels" ALTER COLUMN "owner_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "db_pxl8r_grid_pixels" ADD COLUMN "position" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
-- Hand-edited: number each grid's rows by pixel name, so existing grids get a stable row order.
UPDATE "db_pxl8r_grid_pixels" gp
SET "position" = r.pos
FROM (
  SELECT gp2.grid_id, gp2.pixel_id,
         ROW_NUMBER() OVER (PARTITION BY gp2.grid_id ORDER BY p.name, gp2.pixel_id) - 1 AS pos
  FROM "db_pxl8r_grid_pixels" gp2
  JOIN "db_pxl8r_pixels" p ON p.id = gp2.pixel_id
) r
WHERE r.grid_id = gp.grid_id AND r.pixel_id = gp.pixel_id;--> statement-breakpoint
ALTER TABLE "db_pxl8r_cells" ADD CONSTRAINT "db_pxl8r_cells_grid_id_pixel_id_db_pxl8r_grid_pixels_grid_id_pixel_id_fk" FOREIGN KEY ("grid_id","pixel_id") REFERENCES "public"."db_pxl8r_grid_pixels"("grid_id","pixel_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_pxl8r_cells" ADD CONSTRAINT "db_pxl8r_cells_pixel_id_db_pxl8r_pixels_id_fk" FOREIGN KEY ("pixel_id") REFERENCES "public"."db_pxl8r_pixels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_pxl8r_cells" DROP COLUMN "row";