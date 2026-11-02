CREATE TABLE `reader_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`identity_hash` text NOT NULL,
	`display_name` text NOT NULL,
	`avatar_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reader_accounts_identity_hash_unique` ON `reader_accounts` (`identity_hash`);--> statement-breakpoint
CREATE TABLE `reader_progress` (
	`account_id` text NOT NULL,
	`chapter_id` text NOT NULL,
	`status` text DEFAULT 'unread' NOT NULL,
	`visited_at` integer DEFAULT 0 NOT NULL,
	`checkpoint` text,
	`checkpoint_at` integer DEFAULT 0 NOT NULL,
	`favorite` integer DEFAULT false NOT NULL,
	`read_later` integer DEFAULT false NOT NULL,
	PRIMARY KEY(`account_id`, `chapter_id`)
);
--> statement-breakpoint
ALTER TABLE `chapter_comments` ADD `account_id` text;