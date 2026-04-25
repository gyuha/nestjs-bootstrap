"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestUser = createTestUser;
exports.createTestAdmin = createTestAdmin;
const role_value_object_1 = require("../../modules/users/domain/value-objects/role.value-object");
function createTestUser(overrides = {}) {
  return {
    id: "test-user-id",
    email: "test@example.com",
    passwordHash: "$2b$12$hashedpassword",
    name: "Test User",
    role: role_value_object_1.Role.USER,
    status: role_value_object_1.UserStatus.ACTIVE,
    emailVerified: false,
    lockoutUntil: null,
    failedLoginAttempts: 0,
    verificationToken: null,
    verificationTokenExpiry: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
function createTestAdmin(overrides = {}) {
  return createTestUser({ role: role_value_object_1.Role.ADMIN, ...overrides });
}
//# sourceMappingURL=fixture-helpers.js.map
