export type AuthProvider = "password" | "google";

export type AuthIdentity = {
  id: string;
  userId: string;
  provider: AuthProvider;
  providerUserId: string;
  passwordHash: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};
