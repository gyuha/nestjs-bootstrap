"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderTypeVO = exports.ProviderType = void 0;
const value_object_1 = require("../../../../shared/domain/value-objects/value-object");
var ProviderType;
(function (ProviderType) {
    ProviderType["OPENAI"] = "openai";
    ProviderType["AZURE_OPENAI"] = "azure-openai";
})(ProviderType || (exports.ProviderType = ProviderType = {}));
class ProviderTypeVO extends value_object_1.ValueObject {
    constructor(value) {
        super(value);
        this.value = value;
    }
}
exports.ProviderTypeVO = ProviderTypeVO;
//# sourceMappingURL=provider-type.vo.js.map