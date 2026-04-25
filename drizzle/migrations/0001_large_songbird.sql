CREATE TYPE "public"."actor_type" AS ENUM('USER', 'ADMIN', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_CHANGE', 'EMAIL_VERIFY', 'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'ROLE_CHANGE', 'ACCOUNT_LOCK', 'ACCOUNT_UNLOCK', 'API_CALL', 'MAGIC_LINK_REQUEST', 'PASSWORD_RESET_REQUEST');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"actor_type" "actor_type" NOT NULL,
	"event_type" "event_type" NOT NULL,
	"target_resource" varchar(255),
	"event_data" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
