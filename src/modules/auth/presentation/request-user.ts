import type { Request } from "express";
import type { UserRole } from "../../users/domain/user.types";

export type AuthenticatedUser = {
  id: string;
  role: UserRole;
  sessionId?: string;
};

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};
