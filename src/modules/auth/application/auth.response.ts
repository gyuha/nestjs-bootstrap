import type { UserResponse } from "../../users/application/user.response";

export type AuthSessionResponse = {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
};
