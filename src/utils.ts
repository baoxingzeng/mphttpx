/* eslint-disable no-prototype-builtins */
/** @internal */ export const g: typeof globalThis =
    (typeof globalThis !== "undefined" && globalThis) ||
    (typeof self !== "undefined" && self) ||
    // @ts-ignore eslint-disable-next-line no-undef
    (typeof global !== "undefined" && global) ||
    {};

/** @internal */
export const SymbolP = {
    iterator: ((typeof Symbol === "function") as true && (Symbol.iterator || "Symbol(Symbol.iterator)" as never)) as typeof Symbol.iterator,
    toStringTag: ((typeof Symbol === "function") as true && (Symbol.toStringTag || "Symbol(Symbol.toStringTag)" as never)) as typeof Symbol.toStringTag,
};

/** @internal */
export class DOMExceptionP extends Error {
    constructor(message?: string, name?: string) {
        super(message);
        if (name !== undefined) this.name = "" + name;
    }

    /** @internal */ get [SymbolP.toStringTag]() { return "DOMException"; }
    /** @internal */ get __MPHTTPX__() { return { chain: ["DOMException"] }; }
}

/** @internal */
export function className(object: { __MPHTTPX__: { chain: string[] } }): string {
    return object.__MPHTTPX__.chain[0]!;
}

/** @internal */
export function setState<T extends object, K extends keyof T>(target: T, name: K, value: T[K]) {
    Object.defineProperty(target, name, { value });
}

/** @internal */
export function isObjectType<T>(name: string, value: unknown): value is T {
    return Object.prototype.toString.call(value) === `[object ${name}]`;
}

/** @internal */
export function isPolyfillType<T>(name: string, value: unknown, strict = false): value is T {
    const field = "__MPHTTPX__";
    type THasField = object & Record<typeof field, unknown>;
    type TFieldIsObject = object & Record<typeof field, object>;
    type THasChain = object & Record<typeof field, object & Record<"chain", unknown>>;
    type TChainIsArray = object & Record<typeof field, object & Record<"chain", Array<unknown>>>;

    return !!value
        && typeof value === "object"
        && field in value
        && !!(value as THasField)[field]
        && typeof (value as THasField)[field] === "object"
        && "chain" in (value as TFieldIsObject)[field]
        && Array.isArray((value as THasChain)[field].chain)
        && ((index: number) => strict ? index === 0 : index > -1)((value as TChainIsArray)[field].chain.indexOf(name));
}

/** @internal */
export function checkArgsLength(actual: number, expect: number, className: string, funcName?: string) {
    if (actual < expect) {
        throw new TypeError(`Failed to ${funcName ? ("execute '" + funcName + "' on") : "construct"} '${className}': ${expect} argument${expect > 1 ? "s" : ""} required, but only ${actual} present.`);
    }
}
