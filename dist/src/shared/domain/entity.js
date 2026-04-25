"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Entity = void 0;
class Entity {
    constructor(props) {
        this.props = props;
    }
    get id() {
        return this.props.id;
    }
    equals(entity) {
        if (entity === null || entity === undefined) {
            return false;
        }
        return this.id === entity.id;
    }
}
exports.Entity = Entity;
//# sourceMappingURL=entity.js.map