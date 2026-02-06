import { isPolyfillType } from "../utils";

/** @internal */
export function isEventTarget(value: unknown): value is EventTarget {
    return isPolyfillType<EventTarget>("EventTarget", value) || isExternalEventTarget(value);
}

function isExternalEventTarget(value: unknown): value is EventTarget {
    return !!value
        && typeof value === "object"
        && "addEventListener" in value
        && typeof value.addEventListener === "function"
        && "removeEventListener" in value
        && typeof value.removeEventListener === "function";
}
