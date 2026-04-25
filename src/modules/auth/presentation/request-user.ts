import type { Request } from "express";
import type { UserRole } from "../../users/domain/user.types";

export type AuthenticatedUser = {
  id: string;
  role: UserRole;
};

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};
