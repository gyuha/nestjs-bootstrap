export type UserRole = "USER" | "ADMIN";
export type UserStatus = "active" | "inactive";

export type UserProfilePatch = {
  displayName?: string;
  avatarUrl?: string | null;
  bio?: string | null;
};
