DROP INDEX `unique_server_ipv4_idx`;--> statement-breakpoint
DROP INDEX `unique_server_ipv6_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `unique_server_ipv4_idx` ON `servers` (`ipv4`) WHERE ipv4 IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `unique_server_ipv6_idx` ON `servers` (`ipv6`) WHERE ipv6 IS NOT NULL;