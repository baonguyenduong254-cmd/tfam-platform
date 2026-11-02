CREATE TABLE `chapter_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`chapter_id` text NOT NULL,
	`visitor_hash` text NOT NULL,
	`display_name` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `chapter_comments_page` ON `chapter_comments` (`chapter_id`,`id`);--> statement-breakpoint
CREATE TABLE `chapter_reactions` (
	`chapter_id` text NOT NULL,
	`visitor_hash` text NOT NULL,
	`value` integer NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`chapter_id`, `visitor_hash`)
);
--> statement-breakpoint
CREATE TABLE `chapter_visits` (
	`chapter_id` text NOT NULL,
	`visitor_hash` text NOT NULL,
	`last_viewed_at` integer NOT NULL,
	`views` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`chapter_id`, `visitor_hash`)
);
--> statement-breakpoint
CREATE TABLE `reader_rate_limits` (
	`bucket` text PRIMARY KEY NOT NULL,
	`attempts` integer NOT NULL,
	`reset_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `reader_limits_expiry` ON `reader_rate_limits` (`reset_at`);