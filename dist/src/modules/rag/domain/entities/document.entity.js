"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Document = void 0;
const entity_1 = require("../../../../shared/domain/entity");
class Document extends entity_1.Entity {
    get content() {
        return this.props.content;
    }
    get metadata() {
        return this.props.metadata;
    }
    get source() {
        return this.props.source;
    }
    get sourcePath() {
        return this.props.sourcePath;
    }
    get createdAt() {
        return this.props.createdAt;
    }
}
exports.Document = Document;
//# sourceMappingURL=document.entity.js.map