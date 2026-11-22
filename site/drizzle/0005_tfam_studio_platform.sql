-- Additive D1 Migration for TFAM Studio (Update 212+ Studio Platform)
-- Strictly additive: never modifies or drops existing production tables
-- (content, reader_accounts, reader_progress, chapter_comments, chapter_reactions, chapter_visits, admin_sessions, admin_login_limits, reader_rate_limits).

CREATE TABLE IF NOT EXISTS `studio_volumes` (
  `id` text PRIMARY KEY NOT NULL,
  `code` text NOT NULL UNIQUE,
  `title` text NOT NULL,
  `language` text DEFAULT 'en' NOT NULL,
  `sort_order` integer DEFAULT 1 NOT NULL,
  `status` text DEFAULT 'draft' NOT NULL,
  `visibility` text DEFAULT 'private' NOT NULL,
  `updated_at` text DEFAULT (datetime('now')) NOT NULL
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `studio_chapters` (
  `id` text PRIMARY KEY NOT NULL,
  `volume_id` text NOT NULL,
  `chapter_number` integer NOT NULL,
  `code` text NOT NULL UNIQUE,
  `title` text NOT NULL,
  `language` text DEFAULT 'en' NOT NULL,
  `content` text DEFAULT '' NOT NULL,
  `word_count` integer DEFAULT 0 NOT NULL,
  `status` text DEFAULT 'draft' NOT NULL,
  `visibility` text DEFAULT 'private' NOT NULL,
  `data_state` text DEFAULT 'draft' NOT NULL,
  `spoiler_gate_chapter` integer,
  `author_notes` text DEFAULT '' NOT NULL,
  `published_at` text,
  `updated_at` text DEFAULT (datetime('now')) NOT NULL
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `studio_chapter_revisions` (
  `id` text PRIMARY KEY NOT NULL,
  `chapter_id` text NOT NULL,
  `version_number` integer NOT NULL,
  `title` text NOT NULL,
  `content` text NOT NULL,
  `word_count` integer DEFAULT 0 NOT NULL,
  `change_summary` text DEFAULT '' NOT NULL,
  `created_at` text DEFAULT (datetime('now')) NOT NULL
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `studio_canon_entries` (
  `id` text PRIMARY KEY NOT NULL,
  `slug` text NOT NULL UNIQUE,
  `title` text NOT NULL,
  `category` text NOT NULL,
  `summary` text DEFAULT '' NOT NULL,
  `body` text DEFAULT '' NOT NULL,
  `source_chapter` integer,
  `data_state` text DEFAULT 'canon' NOT NULL,
  `visibility` text DEFAULT 'private' NOT NULL,
  `private_notes` text DEFAULT '' NOT NULL,
  `updated_at` text DEFAULT (datetime('now')) NOT NULL
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `studio_canon_links` (
  `id` text PRIMARY KEY NOT NULL,
  `source_type` text NOT NULL,
  `source_id` text NOT NULL,
  `target_type` text NOT NULL,
  `target_id` text NOT NULL,
  `relation_label` text DEFAULT 'references' NOT NULL,
  `data_state` text DEFAULT 'canon' NOT NULL,
  `created_at` text DEFAULT (datetime('now')) NOT NULL
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `studio_knowledge_states` (
  `id` text PRIMARY KEY NOT NULL,
  `character_id` text NOT NULL,
  `fact_key` text NOT NULL,
  `fact_statement` text NOT NULL,
  `keywords_json` text DEFAULT '[]' NOT NULL,
  `learned_chapter` integer,
  `certainty` text DEFAULT 'known' NOT NULL,
  `notes` text DEFAULT '' NOT NULL,
  `data_state` text DEFAULT 'canon' NOT NULL
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `studio_what_if_scenarios` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `divergence_chapter` integer DEFAULT 1 NOT NULL,
  `premise` text NOT NULL,
  `notes` text DEFAULT '' NOT NULL,
  `status` text DEFAULT 'exploring' NOT NULL,
  `created_at` text DEFAULT (datetime('now')) NOT NULL
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `studio_published_snapshots` (
  `id` text PRIMARY KEY NOT NULL,
  `entity_type` text NOT NULL,
  `entity_id` text NOT NULL,
  `version_number` integer NOT NULL,
  `visibility` text NOT NULL,
  `spoiler_gate_chapter` integer,
  `payload_json` text NOT NULL,
  `is_active` integer DEFAULT 1 NOT NULL,
  `published_at` text DEFAULT (datetime('now')) NOT NULL
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `studio_import_staging` (
  `id` text PRIMARY KEY NOT NULL,
  `source_filename` text NOT NULL,
  `source_format` text NOT NULL,
  `target_type` text NOT NULL,
  `extracted_title` text NOT NULL,
  `extracted_payload_json` text NOT NULL,
  `status` text DEFAULT 'pending_review' NOT NULL,
  `created_at` text DEFAULT (datetime('now')) NOT NULL
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `studio_audit_logs` (
  `id` text PRIMARY KEY NOT NULL,
  `actor` text NOT NULL,
  `action` text NOT NULL,
  `entity_type` text NOT NULL,
  `entity_id` text DEFAULT '' NOT NULL,
  `details_json` text DEFAULT '{}' NOT NULL,
  `created_at` text DEFAULT (datetime('now')) NOT NULL
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `idx_studio_chapters_num` ON `studio_chapters` (`chapter_number`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_studio_kn_char` ON `studio_knowledge_states` (`character_id`, `learned_chapter`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_studio_staging_status` ON `studio_import_staging` (`status`);
