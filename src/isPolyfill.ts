/* eslint-disable no-prototype-builtins */
/** @internal */ export const g: typeof globalThis =
    (typeof globalThis !== "undefined" && globalThis) ||
    (typeof self !== "undefined" && self) ||
    // @ts-ignore eslint-disable-next-line no-undef
    (typeof global !== "undefined" && global) ||
    {};

/** @internal */
export const polyfill = "MPHTTPX";

/** @internal */
export function Class_setStringTag(targetFunc: Function, stringTag: string) {
    Object.defineProperty(targetFunc.prototype, Symbol.toStringTag, {
        configurable: true,
        value: stringTag,
    });
}

/** @internal */
export function checkArgs(args: any[], className: string, funcName: string, required: number) {
    if (args.length < required) {
        throw new TypeError(`Failed to execute '${funcName}' on '${className}': ${required} argument${required > 1 ? "s" : ""} required, but only ${args.length} present.`);
    }
}

/** @internal */
export class MPException extends Error {
    constructor(message?: string, name?: string) {
        super(message);
        if (name) { this.name = name; }
    }
    name = "Error";
}

/** @internal */
export function isObjectType<T>(name: string, value: unknown): value is T {
    return Object.prototype.toString.call(value) === `[object ${name}]`;
}

/** @internal */
export function isPolyfillType<T>(name: string, value: unknown): value is T {
    type THasIsPolyfill = object & Record<"isPolyfill", unknown>;
    type TIsPolyfillObject = object & Record<"isPolyfill", object>;
    type THasSymbol = object & Record<"isPolyfill", object & Record<"symbol", unknown>>;
    type THasHierarchy = object & Record<"isPolyfill", object & Record<"hierarchy", unknown>>;
    type THierarchyIsArray = object & Record<"isPolyfill", object & Record<"hierarchy", Array<unknown>>>;

    return !!value
        && typeof value === "object"
        && "isPolyfill" in value
        && !!(value as THasIsPolyfill).isPolyfill
        && typeof (value as THasIsPolyfill).isPolyfill === "object"
        && "symbol" in (value as TIsPolyfillObject).isPolyfill
        && (value as THasSymbol).isPolyfill.symbol === polyfill
        && "hierarchy" in (value as TIsPolyfillObject).isPolyfill
        && Array.isArray((value as THasHierarchy).isPolyfill.hierarchy)
        && (value as THierarchyIsArray).isPolyfill.hierarchy.indexOf(name) > -1;
}
