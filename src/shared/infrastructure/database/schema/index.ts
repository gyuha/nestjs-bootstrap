import { sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
  vector,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["USER", "ADMIN"]);
export const userStatus = pgEnum("user_status", ["active", "inactive"]);
export const authProvider = pgEnum("auth_provider", ["password", "google"]);
export const knowledgeDocumentStatus = pgEnum("knowledge_document_status", [
  "active",
  "inactive",
  "indexing",
  "failed",
]);
export const knowledgeSourceType = pgEnum("knowledge_source_type", ["document", "internal_db"]);
export const knowledgeSyncJobStatus = pgEnum("knowledge_sync_job_status", [
  "pending",
  "running",
  "succeeded",
  "failed",
]);
export const chatSessionStatus = pgEnum("chat_session_status", ["active", "closed"]);
export const chatMessageRole = pgEnum("chat_message_role", ["user", "assistant", "system"]);

export const timestampColumns = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 320 }).notNull().unique(),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    status: userStatus("status").notNull().default("active"),
    role: userRole("role").notNull().default("USER"),
    ...timestampColumns(),
  },
  (table) => [uniqueIndex("users_email_lower_unique").on(sql`lower(${table.email})`)],
);

export const authIdentities = pgTable(
  "auth_identities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: authProvider("provider").notNull(),
    providerUserId: varchar("provider_user_id", { length: 320 }).notNull(),
    passwordHash: text("password_hash"),
    emailVerified: boolean("email_verified").notNull().default(false),
    ...timestampColumns(),
  },
  (table) => [
    unique("auth_identities_provider_provider_user_id_unique").on(
      table.provider,
      table.providerUserId,
    ),
    unique("auth_identities_user_id_provider_unique").on(table.userId, table.provider),
  ],
);

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    replacedByTokenId: uuid("replaced_by_token_id"),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("refresh_tokens_user_id_idx").on(table.userId),
    foreignKey({
      columns: [table.replacedByTokenId],
      foreignColumns: [table.id],
      name: "refresh_tokens_replaced_by_token_id_fk",
    }).onDelete("set null"),
  ],
);

export const knowledgeDocuments = pgTable(
  "knowledge_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 200 }).notNull(),
    sourceType: knowledgeSourceType("source_type").notNull().default("document"),
    sourceKey: varchar("source_key", { length: 300 }).notNull(),
    status: knowledgeDocumentStatus("status").notNull().default("indexing"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestampColumns(),
  },
  (table) => [
    unique("knowledge_documents_source_type_source_key_unique").on(
      table.sourceType,
      table.sourceKey,
    ),
    index("knowledge_documents_status_idx").on(table.status),
    index("knowledge_documents_created_by_idx").on(table.createdBy),
  ],
);

export const knowledgeChunks = pgTable(
  "knowledge_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => knowledgeDocuments.id, { onDelete: "cascade" }),
    chunkIndex: integer("chunk_index").notNull(),
    content: text("content").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    ...timestampColumns(),
  },
  (table) => [
    unique("knowledge_chunks_document_id_chunk_index_unique").on(
      table.documentId,
      table.chunkIndex,
    ),
    index("knowledge_chunks_document_id_idx").on(table.documentId),
    index("knowledge_chunks_embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
  ],
);

export const knowledgeSyncJobs = pgTable(
  "knowledge_sync_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id").references(() => knowledgeDocuments.id, {
      onDelete: "set null",
    }),
    sourceType: knowledgeSourceType("source_type").notNull().default("document"),
    sourceKey: varchar("source_key", { length: 300 }).notNull(),
    status: knowledgeSyncJobStatus("status").notNull().default("pending"),
    errorMessage: text("error_message"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    ...timestampColumns(),
  },
  (table) => [
    index("knowledge_sync_jobs_document_id_idx").on(table.documentId),
    index("knowledge_sync_jobs_status_idx").on(table.status),
    index("knowledge_sync_jobs_source_idx").on(table.sourceType, table.sourceKey),
  ],
);

export const chatSessions = pgTable(
  "chat_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    anonymousTokenHash: varchar("anonymous_token_hash", { length: 128 }),
    status: chatSessionStatus("status").notNull().default("active"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    ...timestampColumns(),
  },
  (table) => [
    index("chat_sessions_user_id_idx").on(table.userId),
    index("chat_sessions_status_idx").on(table.status),
    uniqueIndex("chat_sessions_anonymous_token_hash_unique")
      .on(table.anonymousTokenHash)
      .where(sql`${table.anonymousTokenHash} is not null`),
  ],
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => chatSessions.id, { onDelete: "cascade" }),
    role: chatMessageRole("role").notNull(),
    content: text("content").notNull(),
    model: varchar("model", { length: 100 }),
    promptTokens: integer("prompt_tokens"),
    completionTokens: integer("completion_tokens"),
    totalTokens: integer("total_tokens"),
    handoffRequested: boolean("handoff_requested").notNull().default(false),
    handoffReason: text("handoff_reason"),
    handoffStatus: varchar("handoff_status", { length: 40 }),
    handoffRequestedAt: timestamp("handoff_requested_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    ...timestampColumns(),
  },
  (table) => [
    index("chat_messages_session_id_idx").on(table.sessionId),
    index("chat_messages_session_created_at_idx").on(table.sessionId, table.createdAt),
    index("chat_messages_role_idx").on(table.role),
  ],
);

export const chatMessageSources = pgTable(
  "chat_message_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assistantMessageId: uuid("assistant_message_id")
      .notNull()
      .references(() => chatMessages.id, { onDelete: "cascade" }),
    sourceType: knowledgeSourceType("source_type").notNull(),
    documentId: uuid("document_id").references(() => knowledgeDocuments.id, {
      onDelete: "set null",
    }),
    chunkId: uuid("chunk_id").references(() => knowledgeChunks.id, { onDelete: "set null" }),
    score: real("score"),
    excerpt: text("excerpt"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    ...timestampColumns(),
  },
  (table) => [
    index("chat_message_sources_assistant_message_id_idx").on(table.assistantMessageId),
    index("chat_message_sources_document_id_idx").on(table.documentId),
    index("chat_message_sources_chunk_id_idx").on(table.chunkId),
  ],
);

export const schema = {
  userRole,
  userStatus,
  authProvider,
  knowledgeDocumentStatus,
  knowledgeSourceType,
  knowledgeSyncJobStatus,
  chatSessionStatus,
  chatMessageRole,
  users,
  authIdentities,
  refreshTokens,
  knowledgeDocuments,
  knowledgeChunks,
  knowledgeSyncJobs,
  chatSessions,
  chatMessages,
  chatMessageSources,
};
