export class UserNotFoundError extends Error {
  constructor(message = "User not found") {
    super(message);
    this.name = "UserNotFoundError";
  }
}

export class UserEmailAlreadyExistsError extends Error {
  constructor(message = "User email already exists") {
    super(message);
    this.name = "UserEmailAlreadyExistsError";
  }
}
