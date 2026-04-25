ALTER TABLE "auth_identities" ALTER COLUMN "provider_user_id" SET DATA TYPE varchar(320);--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens" USING btree ("user_id");