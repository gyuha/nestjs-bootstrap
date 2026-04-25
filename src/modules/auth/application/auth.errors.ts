export class InvalidAuthCredentialsError extends Error {
  constructor(message = "Invalid email or password") {
    super(message);
    this.name = "InvalidAuthCredentialsError";
  }
}

export class InvalidRefreshTokenError extends Error {
  constructor(message = "Invalid refresh token") {
    super(message);
    this.name = "InvalidRefreshTokenError";
  }
}

export class InactiveUserAuthError extends Error {
  constructor(message = "Invalid email or password") {
    super(message);
    this.name = "InactiveUserAuthError";
  }
}
