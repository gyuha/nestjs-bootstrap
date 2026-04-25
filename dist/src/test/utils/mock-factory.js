"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockFactory = void 0;
class MockFactory {
    static createRepository(methods) {
        return methods;
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
exports.MockFactory = MockFactory;
//# sourceMappingURL=mock-factory.js.map