"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenUsage = void 0;
const entity_1 = require("../../../../shared/domain/entity");
class TokenUsage extends entity_1.Entity {
    get promptTokens() {
        return this.props.promptTokens;
    }
    get completionTokens() {
        return this.props.completionTokens;
    }
    get totalTokens() {
        return this.props.totalTokens;
    }
    get estimatedCostCents() {
        return this.props.estimatedCostCents;
    }
}
exports.TokenUsage = TokenUsage;
//# sourceMappingURL=token-usage.entity.js.map