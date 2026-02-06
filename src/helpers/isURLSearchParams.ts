import { isObjectType, isPolyfillType } from "../utils";

/** @internal */
export function isURLSearchParams(value: unknown): value is URLSearchParams {
    return isPolyfillType<URLSearchParams>("URLSearchParams", value) || isObjectType<URLSearchParams>("URLSearchParams", value);
}
