"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregateRoot = void 0;
const entity_1 = require("./entity");
class AggregateRoot extends entity_1.Entity {
    constructor() {
        super(...arguments);
        this._domainEvents = [];
    }
    get domainEvents() {
        return [...this._domainEvents];
    }
    addDomainEvent(domainEvent) {
        this._domainEvents.push(domainEvent);
    }
    clearDomainEvents() {
        this._domainEvents.splice(0, this._domainEvents.length);
    }
}
exports.AggregateRoot = AggregateRoot;
//# sourceMappingURL=aggregate-root.js.map