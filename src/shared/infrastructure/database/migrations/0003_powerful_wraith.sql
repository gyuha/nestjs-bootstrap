CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TYPE "public"."chat_message_role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TYPE "public"."chat_session_status" AS ENUM('active', 'closed');--> statement-breakpoint
CREATE TYPE "public"."knowledge_document_status" AS ENUM('active', 'inactive', 'indexing', 'failed');--> statement-breakpoint
CREATE TYPE "public"."knowledge_source_type" AS ENUM('document', 'internal_db');--> statement-breakpoint
CREATE TYPE "public"."knowledge_sync_job_status" AS ENUM('pending', 'running', 'succeeded', 'failed');--> statement-breakpoint
CREATE TABLE "chat_message_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assistant_message_id" uuid NOT NULL,
	"source_type" "knowledge_source_type" NOT NULL,
	"document_id" uuid,
	"chunk_id" uuid,
	"score" real,
	"excerpt" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"role" "chat_message_role" NOT NULL,
	"content" text NOT NULL,
	"model" varchar(100),
	"prompt_tokens" integer,
	"completion_tokens" integer,
	"total_tokens" integer,
	"handoff_requested" boolean DEFAULT false NOT NULL,
	"handoff_reason" text,
	"handoff_status" varchar(40),
	"handoff_requested_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"anonymous_token_hash" varchar(128),
	"status" "chat_session_status" DEFAULT 'active' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "knowledge_chunks_document_id_chunk_index_unique" UNIQUE("document_id","chunk_index")
);
--> statement-breakpoint
CREATE TABLE "knowledge_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"source_type" "knowledge_source_type" DEFAULT 'document' NOT NULL,
	"source_key" varchar(300) NOT NULL,
	"status" "knowledge_document_status" DEFAULT 'indexing' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "knowledge_documents_source_type_source_key_unique" UNIQUE("source_type","source_key")
);
--> statement-breakpoint
CREATE TABLE "knowledge_sync_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid,
	"source_type" "knowledge_source_type" DEFAULT 'document' NOT NULL,
	"source_key" varchar(300) NOT NULL,
	"status" "knowledge_sync_job_status" DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_message_sources" ADD CONSTRAINT "chat_message_sources_assistant_message_id_chat_messages_id_fk" FOREIGN KEY ("assistant_message_id") REFERENCES "public"."chat_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_message_sources" ADD CONSTRAINT "chat_message_sources_document_id_knowledge_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."knowledge_documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_message_sources" ADD CONSTRAINT "chat_message_sources_chunk_id_knowledge_chunks_id_fk" FOREIGN KEY ("chunk_id") REFERENCES "public"."knowledge_chunks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_document_id_knowledge_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."knowledge_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_documents" ADD CONSTRAINT "knowledge_documents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_sync_jobs" ADD CONSTRAINT "knowledge_sync_jobs_document_id_knowledge_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."knowledge_documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_message_sources_assistant_message_id_idx" ON "chat_message_sources" USING btree ("assistant_message_id");--> statement-breakpoint
CREATE INDEX "chat_message_sources_document_id_idx" ON "chat_message_sources" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "chat_message_sources_chunk_id_idx" ON "chat_message_sources" USING btree ("chunk_id");--> statement-breakpoint
CREATE INDEX "chat_messages_session_id_idx" ON "chat_messages" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "chat_messages_session_created_at_idx" ON "chat_messages" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "chat_messages_role_idx" ON "chat_messages" USING btree ("role");--> statement-breakpoint
CREATE INDEX "chat_sessions_user_id_idx" ON "chat_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chat_sessions_status_idx" ON "chat_sessions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "chat_sessions_anonymous_token_hash_unique" ON "chat_sessions" USING btree ("anonymous_token_hash") WHERE "chat_sessions"."anonymous_token_hash" is not null;--> statement-breakpoint
CREATE INDEX "knowledge_chunks_document_id_idx" ON "knowledge_chunks" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "knowledge_chunks_embedding_idx" ON "knowledge_chunks" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "knowledge_documents_status_idx" ON "knowledge_documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "knowledge_documents_created_by_idx" ON "knowledge_documents" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "knowledge_sync_jobs_document_id_idx" ON "knowledge_sync_jobs" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "knowledge_sync_jobs_status_idx" ON "knowledge_sync_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "knowledge_sync_jobs_source_idx" ON "knowledge_sync_jobs" USING btree ("source_type","source_key");
