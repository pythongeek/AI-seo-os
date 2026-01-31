import { pgTable, text, timestamp, boolean, uuid, jsonb, integer, date, numeric, bigint, vector, primaryKey, unique, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ==========================================
// CORE TABLES
// ==========================================

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==========================================
// MULTI-TENANCY TABLES
// ==========================================

export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  planTier: text('plan_tier', { enum: ['FREE', 'PRO', 'ENTERPRISE'] }).default('FREE'),
  usageQuotas: jsonb('usage_quotas').default({ properties: 3, aiQueries: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const memberships = pgTable('memberships', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  role: text('role', { enum: ['OWNER', 'ADMIN', 'MEMBER'] }).default('MEMBER').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  unq: unique().on(t.userId, t.orgId),
  orgIdx: index('idx_memberships_org').on(t.orgId),
  userIdx: index('idx_memberships_user').on(t.userId),
}));

export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  scope: text('scope'),
  tokenType: text('token_type'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
}, (t) => ({
  unq: unique().on(t.provider, t.providerAccountId),
  userIdIdx: index('idx_accounts_user').on(t.userId),
}));

export const gscProperties = pgTable('gsc_properties', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  propertyUrl: text('property_url').notNull(),
  verificationMethod: text('verification_method'),
  permissionLevel: text('permission_level').default('siteOwner'),
  lastSynced: timestamp('last_synced', { withTimezone: true }),
  syncStatus: text('sync_status').default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  unq: unique().on(t.orgId, t.propertyUrl),
  orgIdIdx: index('idx_properties_org').on(t.orgId),
}));

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: uuid('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable('verificationToken', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (vt) => ({
  compositePk: primaryKey({ columns: [vt.identifier, vt.token] }),
}));

// ==========================================
// SEARCH ANALYTICS (Time-Series)
// ==========================================

export const searchAnalytics = pgTable('search_analytics', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
  propertyId: uuid('property_id').references(() => gscProperties.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  query: text('query').notNull(),
  page: text('page').notNull(),
  country: text('country').default('unknown'),
  device: text('device').default('DESKTOP'),
  clicks: integer('clicks').default(0),
  impressions: integer('impressions').default(0),
  ctr: numeric('ctr', { precision: 5, scale: 4 }).default('0'),
  position: numeric('position', { precision: 5, scale: 2 }).default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.id, t.date] }),
  orgIdx: index('idx_sa_org').on(t.orgId),
  propertyDateIdx: index('idx_sa_property_date').on(t.propertyId, t.date),
  upsertConstraint: unique('unq_sa_upsert').on(t.propertyId, t.date, t.query, t.page, t.device, t.country),
}));

// ==========================================
// URL METRICS
// ==========================================

export const urlMetrics = pgTable('url_metrics', {
  id: uuid('id').defaultRandom().primaryKey(),
  propertyId: uuid('property_id').references(() => gscProperties.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  seoPriorityScore: numeric('seo_priority_score', { precision: 3, scale: 2 }).default('0.5'),
  trafficPotential: integer('traffic_potential').default(0),
  crawlFrequency: integer('crawl_frequency').default(0),
  internalLinksCount: integer('internal_links_count').default(0),
  externalLinksCount: integer('external_links_count').default(0),
  indexingState: text('indexing_state').default('UNKNOWN'),
  lastCrawled: timestamp('last_crawled', { withTimezone: true }),
  lastIndexed: timestamp('last_indexed', { withTimezone: true }),
  coreWebVitalsScore: numeric('core_web_vitals_score', { precision: 3, scale: 1 }),
  pageSpeedScore: numeric('page_speed_score', { precision: 3, scale: 1 }),
  contentScore: numeric('content_score', { precision: 3, scale: 2 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  unq: unique().on(t.propertyId, t.url),
  priorityIdx: index('idx_url_priority').on(t.propertyId, t.seoPriorityScore),
  indexingIdx: index('idx_url_indexing').on(t.propertyId, t.indexingState),
  crawlIdx: index('idx_url_crawl').on(t.propertyId, t.crawlFrequency),
}));

// ==========================================
// RANKING HISTORY
// ==========================================

export const rankingHistory = pgTable('ranking_history', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  propertyId: uuid('property_id').references(() => gscProperties.id, { onDelete: 'cascade' }),
  query: text('query').notNull(),
  page: text('page').notNull(),
  date: date('date').notNull(),
  position: numeric('position', { precision: 5, scale: 2 }),
  positionChange: numeric('position_change', { precision: 5, scale: 2 }).default('0'),
  clicksChange: integer('clicks_change').default(0),
  impressionsChange: integer('impressions_change').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  trendsIdx: index('idx_rh_trends').on(t.propertyId, t.query, t.date),
  velocityIdx: index('idx_rh_velocity').on(t.propertyId, t.positionChange),
}));

// ==========================================
// INDEXING ISSUES
// ==========================================

export const indexingIssues = pgTable('indexing_issues', {
  id: uuid('id').defaultRandom().primaryKey(),
  propertyId: uuid('property_id').references(() => gscProperties.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  issueType: text('issue_type').notNull(),
  issueDetails: jsonb('issue_details').default({}),
  discoveredDate: date('discovered_date').defaultNow(),
  resolvedDate: date('resolved_date'),
  severity: text('severity').default('WARNING'),
  autoFixAttempted: boolean('auto_fix_attempted').default(false),
  resolutionNotes: text('resolution_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  openIdx: index('idx_issues_open').on(t.propertyId, t.resolvedDate),
  severityIdx: index('idx_issues_severity').on(t.propertyId, t.severity),
}));

// ==========================================
// AGENT ACTIONS (Episodic Memory)
// ==========================================

export const agentActions = pgTable('agent_actions', {
  id: uuid('id').defaultRandom().primaryKey(),
  propertyId: uuid('property_id').references(() => gscProperties.id, { onDelete: 'cascade' }),
  agentType: text('agent_type').notNull(),
  actionType: text('action_type').notNull(),
  contextSummary: text('context_summary'),
  affectedUrls: text('affected_urls').array().default([]),
  relatedQueries: text('related_queries').array().default([]),
  actionDetails: jsonb('action_details').notNull().default({}),
  executedAt: timestamp('executed_at', { withTimezone: true }).defaultNow(),
  measuredImpact: jsonb('measured_impact'),
  impactMeasuredAt: timestamp('impact_measured_at', { withTimezone: true }),
  successScore: numeric('success_score', { precision: 3, scale: 2 }),
  notes: text('notes'),
}, (t) => ({
  propertyIdx: index('idx_actions_property').on(t.propertyId, t.executedAt),
  successIdx: index('idx_actions_success').on(t.agentType, t.successScore),
  typeIdx: index('idx_actions_type').on(t.actionType, t.executedAt),
}));

// ==========================================
// MEMORY STORE (Vector Embeddings)
// ==========================================

export const memoryStore = pgTable('memory_store', {
  id: uuid('id').defaultRandom().primaryKey(),
  propertyId: uuid('property_id').references(() => gscProperties.id, { onDelete: 'cascade' }),
  memoryType: text('memory_type').notNull().default('EPISODIC'),
  contentText: text('content_text').notNull(),
  // Drizzle supports vector type with dimensions
  embedding: vector('embedding', { dimensions: 1536 }),
  metadata: jsonb('metadata').default({}),
  importanceWeight: numeric('importance_weight', { precision: 3, scale: 2 }).default('0.5'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  lastAccessed: timestamp('last_accessed', { withTimezone: true }),
  accessCount: integer('access_count').default(0),
}, (t) => ({
  embeddingIdx: index('memory_embedding_idx').using('hnsw', t.embedding.op('vector_cosine_ops')),
  propertyIdx: index('idx_memory_property').on(t.propertyId, t.memoryType, t.lastAccessed),
  importanceIdx: index('idx_memory_importance').on(t.importanceWeight),
}));

// ==========================================
// SKILL LIBRARY
// ==========================================

export const skillLibrary = pgTable('skill_library', {
  id: uuid('id').defaultRandom().primaryKey(),
  propertyId: uuid('property_id').references(() => gscProperties.id, { onDelete: 'cascade' }),
  strategyName: text('strategy_name').notNull(),
  strategyDescription: text('strategy_description'),
  contextPattern: text('context_pattern').notNull(),
  actionSteps: jsonb('action_steps').notNull().default([]),
  successRate: numeric('success_rate', { precision: 4, scale: 3 }).default('0'),
  timesApplied: integer('times_applied').default(0),
  avgImpactScore: numeric('avg_impact_score', { precision: 3, scale: 2 }).default('0'),
  promotedAt: timestamp('promoted_at', { withTimezone: true }).defaultNow(),
  lastUsed: timestamp('last_used', { withTimezone: true }),
  tags: text('tags').array().default([]),
}, (t) => ({
  successIdx: index('idx_skills_success').on(t.successRate, t.timesApplied),
}));

// ==========================================
// AI INSIGHTS
// ==========================================

export const aiInsights = pgTable('ai_insights', {
  id: uuid('id').defaultRandom().primaryKey(),
  propertyId: uuid('property_id').references(() => gscProperties.id, { onDelete: 'cascade' }),
  insightType: text('insight_type').notNull(),
  title: text('title').notNull(),
  summary: text('summary'),
  severity: text('severity').default('INFO'),
  affectedUrls: text('affected_urls').array().default([]),
  recommendedActions: jsonb('recommended_actions').default([]),
  generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow(),
  dismissedAt: timestamp('dismissed_at', { withTimezone: true }),
  actedUpon: boolean('acted_upon').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  activeIdx: index('idx_insights_active').on(t.propertyId, t.dismissedAt, t.severity),
  typeIdx: index('idx_insights_type').on(t.propertyId, t.insightType, t.generatedAt),
}));

// ==========================================
// BACKGROUND JOBS
// ==========================================

export const backgroundJobs = pgTable('background_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  jobType: text('job_type').notNull(),
  propertyId: uuid('property_id').references(() => gscProperties.id, { onDelete: 'cascade' }),
  status: text('status').default('PENDING'),
  payload: jsonb('payload').default({}),
  result: jsonb('result'),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  retryCount: integer('retry_count').default(0),
  maxRetries: integer('max_retries').default(3),
  workerId: text('worker_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  statusIdx: index('idx_jobs_status').on(t.status, t.createdAt),
  propertyIdx: index('idx_jobs_property').on(t.propertyId, t.status),
  typeIdx: index('idx_jobs_type').on(t.jobType, t.status),
}));
