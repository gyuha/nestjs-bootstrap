"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValueObject = void 0;
class ValueObject {
    constructor(props) {
        this.props = props;
    }
    equals(valueObject) {
        if (valueObject === null || valueObject === undefined) {
            return false;
        }
        return JSON.stringify(this.props) === JSON.stringify(valueObject.props);
    }
}
exports.ValueObject = ValueObject;
//# sourceMappingURL=value-object.js.map