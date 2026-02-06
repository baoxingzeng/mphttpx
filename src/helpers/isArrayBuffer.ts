import { isObjectType } from "../utils";

/** @internal */
export function isArrayBuffer(value: unknown): value is ArrayBuffer {
    // Mini Program
    return isObjectType<ArrayBuffer>("ArrayBuffer", value) || (!!value && typeof value === "object" && ArrayBuffer.prototype.isPrototypeOf(value));
}
