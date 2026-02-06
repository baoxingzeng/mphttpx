import { isPolyfillType } from "../utils";

/** @internal */
export function isBlob(value: unknown, strict = false): value is Blob {
    return isPolyfillType<Blob>("Blob", value, strict) || isExternalBlob(value, strict);
}

function isExternalBlob(value: unknown, strict = false): value is Blob {
    let expects = ["[object Blob]"];
    if (!strict) expects.push("[object File]");

    return (expects.indexOf(Object.prototype.toString.call(value)) > -1 || expects.indexOf(String(value)) > -1)
        && "size" in (value as object)
        && typeof (value as (object & Record<"size", unknown>)).size === "number"
        && "arrayBuffer" in (value as object)
        && typeof (value as (object & Record<"arrayBuffer", unknown>)).arrayBuffer === "function";
}
