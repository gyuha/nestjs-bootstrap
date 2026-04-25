"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIRequest = void 0;
const aggregate_root_1 = require("../../../../shared/domain/aggregate-root");
class AIRequest extends aggregate_root_1.AggregateRoot {
    get id() {
        return this.props.id;
    }
    get messages() {
        return this.props.messages;
    }
    get model() {
        return this.props.model ?? 'gpt-4o';
    }
    get temperature() {
        return this.props.temperature ?? 0.7;
    }
    get maxTokens() {
        return this.props.maxTokens ?? 2048;
    }
    get sessionId() {
        return this.props.sessionId;
    }
    get userId() {
        return this.props.userId;
    }
}
exports.AIRequest = AIRequest;
//# sourceMappingURL=ai-request.entity.js.map