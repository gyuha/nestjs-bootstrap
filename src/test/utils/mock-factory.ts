export class MockFactory {
  static createRepository<T>(methods: Partial<Record<keyof T, jest.Mock>>): T {
    return methods as T;
  }

  static createUserRepository() {
    return MockFactory.createRepository({
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByOAuthProvider: jest.fn(),
      findActiveById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    });
  }
}
