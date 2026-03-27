CREATE TYPE "public"."cell_type" AS ENUM('boolean', 'numeric', 'rating', 'time');--> statement-breakpoint
CREATE TYPE "public"."pixel_type" AS ENUM('workout', 'project', 'finance', 'mood', 'skill', 'habit', 'reading', 'social', 'personal', 'journal', 'scale', 'custom');--> statement-breakpoint
CREATE TYPE "public"."scale_type" AS ENUM('daily', 'weekly', 'monthly', 'yearly', 'custom');--> statement-breakpoint
CREATE TYPE "public"."theme" AS ENUM('journal', 'matrix', 'knightrider', 'synthwave', 'blueprint');--> statement-breakpoint
CREATE TYPE "public"."unit_type" AS ENUM('percent', 'dollar', 'hour', 'minute', 'day', 'gram', 'lbs', 'cups', 'gallon', 'reps', 'steps', 'miles', 'kilometers', 'pages', 'books', 'rating', 'custom');--> statement-breakpoint
CREATE TABLE "db_pxl8r_account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "db_pxl8r_cells" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text,
	"grid_id" uuid NOT NULL,
	"pixel_id" uuid,
	"col" smallint NOT NULL,
	"row" smallint NOT NULL,
	"value" integer,
	"note" text,
	"color_override" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "db_pxl8r_color_palettes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"owner_id" text,
	"is_public" boolean DEFAULT false,
	"colors" text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "db_pxl8r_grid_pixels" (
	"grid_id" uuid NOT NULL,
	"pixel_id" uuid NOT NULL,
	"sort_order" text DEFAULT 'manual' NOT NULL,
	CONSTRAINT "db_pxl8r_grid_pixels_grid_id_pixel_id_pk" PRIMARY KEY("grid_id","pixel_id")
);
--> statement-breakpoint
CREATE TABLE "db_pxl8r_grids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"owner_id" text NOT NULL,
	"is_public" boolean DEFAULT false,
	"columns" smallint DEFAULT 7 NOT NULL,
	"rows" smallint DEFAULT 52 NOT NULL,
	"scale_type" "scale_type" DEFAULT 'daily',
	"scale_unit" "unit_type",
	"scale_start" smallint,
	"scale_end" smallint,
	"scale_label" text,
	"theme" "theme",
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "db_pxl8r_page_grids" (
	"page_id" uuid NOT NULL,
	"grid_id" uuid NOT NULL,
	"sort_order" text DEFAULT 'manual' NOT NULL,
	CONSTRAINT "db_pxl8r_page_grids_page_id_grid_id_pk" PRIMARY KEY("page_id","grid_id")
);
--> statement-breakpoint
CREATE TABLE "db_pxl8r_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"owner_id" text NOT NULL,
	"is_public" boolean DEFAULT false,
	"theme" "theme",
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "db_pxl8r_pixels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text,
	"name" text NOT NULL,
	"description" text,
	"type" "pixel_type" NOT NULL,
	"unit" "unit_type" NOT NULL,
	"end_goal" integer,
	"color" text NOT NULL,
	"completed_at" timestamp with time zone DEFAULT NULL,
	"progress" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "progress_range" CHECK ("db_pxl8r_pixels"."progress" >= 0 AND "db_pxl8r_pixels"."progress" <= 100)
);
--> statement-breakpoint
CREATE TABLE "db_pxl8r_saved_grids" (
	"user_id" text NOT NULL,
	"grid_id" uuid NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "db_pxl8r_saved_grids_user_id_grid_id_pk" PRIMARY KEY("user_id","grid_id")
);
--> statement-breakpoint
CREATE TABLE "db_pxl8r_saved_pixels" (
	"user_id" text NOT NULL,
	"pixel_id" uuid NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "db_pxl8r_saved_pixels_user_id_pixel_id_pk" PRIMARY KEY("user_id","pixel_id")
);
--> statement-breakpoint
CREATE TABLE "db_pxl8r_saved_templates" (
	"user_id" text NOT NULL,
	"template_id" uuid NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "db_pxl8r_saved_templates_user_id_template_id_pk" PRIMARY KEY("user_id","template_id")
);
--> statement-breakpoint
CREATE TABLE "db_pxl8r_session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "db_pxl8r_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "db_pxl8r_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"owner_id" text,
	"is_public" boolean DEFAULT false,
	"config" jsonb NOT NULL,
	"tags" text[] DEFAULT '{}',
	"theme" "theme",
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "db_pxl8r_users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"theme" "theme" DEFAULT 'journal',
	"saved_pixel_ids" text[] DEFAULT ARRAY[]::text[],
	"saved_grid_ids" text[] DEFAULT ARRAY[]::text[],
	"saved_template_ids" text[] DEFAULT ARRAY[]::text[],
	CONSTRAINT "db_pxl8r_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "db_pxl8r_verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "db_pxl8r_account" ADD CONSTRAINT "db_pxl8r_account_user_id_db_pxl8r_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."db_pxl8r_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_pxl8r_cells" ADD CONSTRAINT "db_pxl8r_cells_owner_id_db_pxl8r_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."db_pxl8r_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_pxl8r_cells" ADD CONSTRAINT "db_pxl8r_cells_grid_id_db_pxl8r_grids_id_fk" FOREIGN KEY ("grid_id") REFERENCES "public"."db_pxl8r_grids"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_pxl8r_cells" ADD CONSTRAINT "db_pxl8r_cells_pixel_id_db_pxl8r_pixels_id_fk" FOREIGN KEY ("pixel_id") REFERENCES "public"."db_pxl8r_pixels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_pxl8r_color_palettes" ADD CONSTRAINT "db_pxl8r_color_palettes_owner_id_db_pxl8r_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."db_pxl8r_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_pxl8r_grid_pixels" ADD CONSTRAINT "db_pxl8r_grid_pixels_grid_id_db_pxl8r_grids_id_fk" FOREIGN KEY ("grid_id") REFERENCES "public"."db_pxl8r_grids"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_pxl8r_grid_pixels" ADD CONSTRAINT "db_pxl8r_grid_pixels_pixel_id_db_pxl8r_pixels_id_fk" FOREIGN KEY ("pixel_id") REFERENCES "public"."db_pxl8r_pixels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_pxl8r_grids" ADD CONSTRAINT "db_pxl8r_grids_owner_id_db_pxl8r_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."db_pxl8r_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_pxl8r_page_grids" ADD CONSTRAINT "db_pxl8r_page_grids_page_id_db_pxl8r_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."db_pxl8r_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_pxl8r_page_grids" ADD CONSTRAINT "db_pxl8r_page_grids_grid_id_db_pxl8r_grids_id_fk" FOREIGN KEY ("grid_id") REFERENCES "public"."db_pxl8r_grids"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_pxl8r_pages" ADD CONSTRAINT "db_pxl8r_pages_owner_id_db_pxl8r_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."db_pxl8r_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_pxl8r_pixels" ADD CONSTRAINT "db_pxl8r_pixels_owner_id_db_pxl8r_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."db_pxl8r_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_pxl8r_saved_grids" ADD CONSTRAINT "db_pxl8r_saved_grids_user_id_db_pxl8r_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."db_pxl8r_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_pxl8r_saved_grids" ADD CONSTRAINT "db_pxl8r_saved_grids_grid_id_db_pxl8r_grids_id_fk" FOREIGN KEY ("grid_id") REFERENCES "public"."db_pxl8r_grids"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_pxl8r_saved_pixels" ADD CONSTRAINT "db_pxl8r_saved_pixels_user_id_db_pxl8r_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."db_pxl8r_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_pxl8r_saved_pixels" ADD CONSTRAINT "db_pxl8r_saved_pixels_pixel_id_db_pxl8r_pixels_id_fk" FOREIGN KEY ("pixel_id") REFERENCES "public"."db_pxl8r_pixels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_pxl8r_saved_templates" ADD CONSTRAINT "db_pxl8r_saved_templates_user_id_db_pxl8r_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."db_pxl8r_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_pxl8r_saved_templates" ADD CONSTRAINT "db_pxl8r_saved_templates_template_id_db_pxl8r_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."db_pxl8r_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_pxl8r_session" ADD CONSTRAINT "db_pxl8r_session_user_id_db_pxl8r_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."db_pxl8r_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_pxl8r_templates" ADD CONSTRAINT "db_pxl8r_templates_owner_id_db_pxl8r_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."db_pxl8r_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "db_pxl8r_account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cells_grid_idx" ON "db_pxl8r_cells" USING btree ("grid_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cells_position_idx" ON "db_pxl8r_cells" USING btree ("grid_id","col","row");--> statement-breakpoint
CREATE INDEX "color_palettes_owner_idx" ON "db_pxl8r_color_palettes" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "grids_owner_idx" ON "db_pxl8r_grids" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "pages_owner_idx" ON "db_pxl8r_pages" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "pixels_owner_idx" ON "db_pxl8r_pixels" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "saved_grids_user_idx" ON "db_pxl8r_saved_grids" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "saved_pixels_user_idx" ON "db_pxl8r_saved_pixels" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "saved_templates_user_idx" ON "db_pxl8r_saved_templates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "db_pxl8r_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "templates_owner_idx" ON "db_pxl8r_templates" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "db_pxl8r_verification" USING btree ("identifier");