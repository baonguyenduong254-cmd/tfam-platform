-- Strictly additive D1 migration for Reader OAuth (Google + Patreon), Sessions, and Subscriptions
-- Never alters or drops existing tables (content, reader_accounts, reader_progress, chapter_comments, etc.).

CREATE TABLE IF NOT EXISTS `auth_identities` (
  `id` text PRIMARY KEY NOT NULL,
  `account_id` text,
  `provider` text NOT NULL,
  `provider_user_id` text NOT NULL,
  `identity_hash` text NOT NULL,
  `email` text,
  `display_name` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS `auth_identities_provider_user` ON `auth_identities` (`provider`, `provider_user_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `auth_identities_account` ON `auth_identities` (`account_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `auth_identities_identity_hash` ON `auth_identities` (`identity_hash`);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `reader_sessions` (
  `token_hash` text PRIMARY KEY NOT NULL,
  `identity_hash` text NOT NULL,
  `account_id` text,
  `provider` text NOT NULL,
  `email` text,
  `expires_at` integer NOT NULL,
  `created_at` integer NOT NULL
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `reader_sessions_expires` ON `reader_sessions` (`expires_at`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `reader_sessions_account` ON `reader_sessions` (`account_id`);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `oauth_states` (
  `state_hash` text PRIMARY KEY NOT NULL,
  `provider` text NOT NULL,
  `return_to` text NOT NULL,
  `link_account_id` text,
  `expires_at` integer NOT NULL
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `oauth_states_expires` ON `oauth_states` (`expires_at`);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` text PRIMARY KEY NOT NULL,
  `account_id` text NOT NULL,
  `provider` text NOT NULL,
  `tier_id` text NOT NULL,
  `status` text NOT NULL,
  `current_period_end` integer,
  `external_id` text,
  `updated_at` integer NOT NULL
);--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS `subscriptions_account_provider` ON `subscriptions` (`account_id`, `provider`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `subscriptions_status` ON `subscriptions` (`status`);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `payment_orders` (
  `id` text PRIMARY KEY NOT NULL,
  `account_id` text NOT NULL,
  `reference_code` text NOT NULL UNIQUE,
  `provider` text NOT NULL,
  `tier_id` text NOT NULL,
  `amount_cents` integer NOT NULL,
  `currency` text NOT NULL,
  `status` text NOT NULL,
  `created_at` integer NOT NULL,
  `paid_at` integer
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `payment_orders_account` ON `payment_orders` (`account_id`);
