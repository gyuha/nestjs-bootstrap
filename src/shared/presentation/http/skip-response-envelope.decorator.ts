import { SetMetadata } from "@nestjs/common";

export const SKIP_RESPONSE_ENVELOPE = Symbol("SKIP_RESPONSE_ENVELOPE");

export const SkipResponseEnvelope = () => SetMetadata(SKIP_RESPONSE_ENVELOPE, true);
