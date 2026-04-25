"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentChunk = void 0;
const entity_1 = require("../../../../shared/domain/entity");
class DocumentChunk extends entity_1.Entity {
    get content() {
        return this.props.content;
    }
    get embedding() {
        return this.props.embedding;
    }
    get metadata() {
        return this.props.metadata;
    }
}
exports.DocumentChunk = DocumentChunk;
//# sourceMappingURL=document-chunk.entity.js.map