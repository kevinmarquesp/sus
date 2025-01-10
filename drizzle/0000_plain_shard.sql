CREATE TABLE `Groups` (
	`id` text(8) NOT NULL,
	`password` text NOT NULL,
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Groups_id_unique` ON `Groups` (`id`);--> statement-breakpoint
CREATE TABLE `Links` (
	`id` text(8) NOT NULL,
	`groupId` text(8),
	`target` text NOT NULL,
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`groupId`) REFERENCES `Groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Links_id_unique` ON `Links` (`id`);