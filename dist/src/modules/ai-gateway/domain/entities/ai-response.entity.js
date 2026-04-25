"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIResponse = void 0;
const entity_1 = require("../../../../shared/domain/entity");
class AIResponse extends entity_1.Entity {
    get id() {
        return this.props.id;
    }
    get content() {
        return this.props.content;
    }
    get usage() {
        return this.props.usage;
    }
    get model() {
        return this.props.model;
    }
    get latencyMs() {
        return this.props.latencyMs ?? 0;
    }
}
exports.AIResponse = AIResponse;
//# sourceMappingURL=ai-response.entity.js.map