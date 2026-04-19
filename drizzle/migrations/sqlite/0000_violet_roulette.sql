CREATE TABLE `health_snapshots` (
	`created_at` integer NOT NULL,
	`details` text NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`status` text NOT NULL
);
