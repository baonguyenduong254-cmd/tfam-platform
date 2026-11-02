ALTER TABLE `reader_accounts` ADD `registration_ip` text;--> statement-breakpoint
CREATE INDEX `reader_accounts_registration_ip` ON `reader_accounts` (`registration_ip`);