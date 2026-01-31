CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" timestamp with time zone,
	"scope" text,
	"token_type" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_unique" UNIQUE("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agent_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid,
	"agent_type" text NOT NULL,
	"action_type" text NOT NULL,
	"context_summary" text,
	"affected_urls" text[] DEFAULT '{}',
	"related_queries" text[] DEFAULT '{}',
	"action_details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"executed_at" timestamp with time zone DEFAULT now(),
	"measured_impact" jsonb,
	"impact_measured_at" timestamp with time zone,
	"success_score" numeric(3, 2),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid,
	"insight_type" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"severity" text DEFAULT 'INFO',
	"affected_urls" text[] DEFAULT '{}',
	"recommended_actions" jsonb DEFAULT '[]'::jsonb,
	"generated_at" timestamp with time zone DEFAULT now(),
	"dismissed_at" timestamp with time zone,
	"acted_upon" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "background_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_type" text NOT NULL,
	"property_id" uuid,
	"status" text DEFAULT 'PENDING',
	"payload" jsonb DEFAULT '{}'::jsonb,
	"result" jsonb,
	"error_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"retry_count" integer DEFAULT 0,
	"max_retries" integer DEFAULT 3,
	"worker_id" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gsc_properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"property_url" text NOT NULL,
	"verification_method" text,
	"permission_level" text DEFAULT 'siteOwner',
	"last_synced" timestamp with time zone,
	"sync_status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gsc_properties_user_id_property_url_unique" UNIQUE("user_id","property_url")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "indexing_issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid,
	"url" text NOT NULL,
	"issue_type" text NOT NULL,
	"issue_details" jsonb DEFAULT '{}'::jsonb,
	"discovered_date" date DEFAULT now(),
	"resolved_date" date,
	"severity" text DEFAULT 'WARNING',
	"auto_fix_attempted" boolean DEFAULT false,
	"resolution_notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "memory_store" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid,
	"memory_type" text DEFAULT 'EPISODIC' NOT NULL,
	"content_text" text NOT NULL,
	"embedding" vector(1536),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"importance_weight" numeric(3, 2) DEFAULT '0.5',
	"created_at" timestamp with time zone DEFAULT now(),
	"last_accessed" timestamp with time zone,
	"access_count" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ranking_history" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ranking_history_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"property_id" uuid,
	"query" text NOT NULL,
	"page" text NOT NULL,
	"date" date NOT NULL,
	"position" numeric(5, 2),
	"position_change" numeric(5, 2) DEFAULT '0',
	"clicks_change" integer DEFAULT 0,
	"impressions_change" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "search_analytics" (
	"id" bigint GENERATED ALWAYS AS IDENTITY (sequence name "search_analytics_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"property_id" uuid,
	"date" date NOT NULL,
	"query" text NOT NULL,
	"page" text NOT NULL,
	"country" text DEFAULT 'unknown',
	"device" text DEFAULT 'DESKTOP',
	"clicks" integer DEFAULT 0,
	"impressions" integer DEFAULT 0,
	"ctr" numeric(5, 4) DEFAULT '0',
	"position" numeric(5, 2) DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "search_analytics_id_date_pk" PRIMARY KEY("id","date"),
	CONSTRAINT "unq_sa_upsert" UNIQUE("property_id","date","query","page","device","country")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "skill_library" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid,
	"strategy_name" text NOT NULL,
	"strategy_description" text,
	"context_pattern" text NOT NULL,
	"action_steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"success_rate" numeric(4, 3) DEFAULT '0',
	"times_applied" integer DEFAULT 0,
	"avg_impact_score" numeric(3, 2) DEFAULT '0',
	"promoted_at" timestamp with time zone DEFAULT now(),
	"last_used" timestamp with time zone,
	"tags" text[] DEFAULT '{}'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "url_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid,
	"url" text NOT NULL,
	"seo_priority_score" numeric(3, 2) DEFAULT '0.5',
	"traffic_potential" integer DEFAULT 0,
	"crawl_frequency" integer DEFAULT 0,
	"internal_links_count" integer DEFAULT 0,
	"external_links_count" integer DEFAULT 0,
	"indexing_state" text DEFAULT 'UNKNOWN',
	"last_crawled" timestamp with time zone,
	"last_indexed" timestamp with time zone,
	"core_web_vitals_score" numeric(3, 1),
	"page_speed_score" numeric(3, 1),
	"content_score" numeric(3, 2),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "url_metrics_property_id_url_unique" UNIQUE("property_id","url")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_actions" ADD CONSTRAINT "agent_actions_property_id_gsc_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."gsc_properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_property_id_gsc_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."gsc_properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "background_jobs" ADD CONSTRAINT "background_jobs_property_id_gsc_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."gsc_properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gsc_properties" ADD CONSTRAINT "gsc_properties_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "indexing_issues" ADD CONSTRAINT "indexing_issues_property_id_gsc_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."gsc_properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memory_store" ADD CONSTRAINT "memory_store_property_id_gsc_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."gsc_properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ranking_history" ADD CONSTRAINT "ranking_history_property_id_gsc_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."gsc_properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "search_analytics" ADD CONSTRAINT "search_analytics_property_id_gsc_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."gsc_properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "skill_library" ADD CONSTRAINT "skill_library_property_id_gsc_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."gsc_properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "url_metrics" ADD CONSTRAINT "url_metrics_property_id_gsc_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."gsc_properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_accounts_user" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_actions_property" ON "agent_actions" USING btree ("property_id","executed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_actions_success" ON "agent_actions" USING btree ("agent_type","success_score");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_actions_type" ON "agent_actions" USING btree ("action_type","executed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_insights_active" ON "ai_insights" USING btree ("property_id","dismissed_at","severity");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_insights_type" ON "ai_insights" USING btree ("property_id","insight_type","generated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_jobs_status" ON "background_jobs" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_jobs_property" ON "background_jobs" USING btree ("property_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_jobs_type" ON "background_jobs" USING btree ("job_type","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_properties_user" ON "gsc_properties" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_issues_open" ON "indexing_issues" USING btree ("property_id","resolved_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_issues_severity" ON "indexing_issues" USING btree ("property_id","severity");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memory_embedding_idx" ON "memory_store" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_memory_property" ON "memory_store" USING btree ("property_id","memory_type","last_accessed");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_memory_importance" ON "memory_store" USING btree ("importance_weight");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rh_trends" ON "ranking_history" USING btree ("property_id","query","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rh_velocity" ON "ranking_history" USING btree ("property_id","position_change");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sa_property_date" ON "search_analytics" USING btree ("property_id","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_skills_success" ON "skill_library" USING btree ("success_rate","times_applied");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_url_priority" ON "url_metrics" USING btree ("property_id","seo_priority_score");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_url_indexing" ON "url_metrics" USING btree ("property_id","indexing_state");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_url_crawl" ON "url_metrics" USING btree ("property_id","crawl_frequency");