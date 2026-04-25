import { describe, expect, it } from "vitest";
import { User } from "../../src/modules/users/domain/user.entity";

describe("User", () => {
  it("defaults to USER role and active status, then can deactivate", () => {
    const user = User.create({ email: "a@example.com", displayName: "A" });

    expect(user.role).toBe("USER");
    expect(user.status).toBe("active");

    user.deactivate();

    expect(user.status).toBe("inactive");
  });

  it("updates profile fields without overwriting omitted values", () => {
    const user = User.create({
      email: "profile@example.com",
      displayName: "Profile",
      avatarUrl: "https://example.com/avatar.png",
      bio: "Initial bio",
    });

    user.updateProfile({ displayName: "Updated", bio: null });

    expect(user.displayName).toBe("Updated");
    expect(user.avatarUrl).toBe("https://example.com/avatar.png");
    expect(user.bio).toBeNull();
  });

  it("changes role and status", () => {
    const user = User.create({ email: "admin@example.com", displayName: "Admin" });

    user.changeRole("ADMIN");
    user.changeStatus("inactive");

    expect(user.role).toBe("ADMIN");
    expect(user.status).toBe("inactive");
  });
});
