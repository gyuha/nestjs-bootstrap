export declare class MockFactory {
    static createRepository<T>(methods: Partial<Record<keyof T, jest.Mock>>): T;
    static createUserRepository(): {
        findById: unknown;
        findByEmail: unknown;
        findByOAuthProvider: unknown;
        findActiveById: unknown;
        save: unknown;
        update: unknown;
        delete: unknown;
    };
}
