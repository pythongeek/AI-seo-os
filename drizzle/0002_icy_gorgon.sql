CREATE TABLE IF NOT EXISTS "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"role" text DEFAULT 'MEMBER' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_user_id_org_id_unique" UNIQUE("user_id","org_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"plan_tier" text DEFAULT 'FREE',
	"usage_quotas" jsonb DEFAULT '{"properties":3,"aiQueries":100}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "gsc_properties" DROP CONSTRAINT "gsc_properties_user_id_property_url_unique";--> statement-breakpoint
ALTER TABLE "gsc_properties" DROP CONSTRAINT "gsc_properties_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "idx_properties_user";--> statement-breakpoint
ALTER TABLE "gsc_properties" ADD COLUMN "org_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "search_analytics" ADD COLUMN "org_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memberships" ADD CONSTRAINT "memberships_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_memberships_org" ON "memberships" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_memberships_user" ON "memberships" USING btree ("user_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gsc_properties" ADD CONSTRAINT "gsc_properties_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "search_analytics" ADD CONSTRAINT "search_analytics_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_properties_org" ON "gsc_properties" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sa_org" ON "search_analytics" USING btree ("org_id");--> statement-breakpoint
ALTER TABLE "gsc_properties" DROP COLUMN IF EXISTS "user_id";--> statement-breakpoint
ALTER TABLE "gsc_properties" ADD CONSTRAINT "gsc_properties_org_id_property_url_unique" UNIQUE("org_id","property_url");