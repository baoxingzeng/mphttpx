import { isSequence } from "../helpers/isSequence";
import { g, SymbolP, setState, isPolyfillType, checkArgsLength } from "../utils";

export class HeadersP implements Headers, MPObject {
    constructor(init?: HeadersInit) {
        setState(this, "__Headers__", new HeadersState());

        if (init !== undefined) {
            if (isHeaders(init)) {
                init.forEach((value, name) => { Headers_append(this, name, value, ""); }, this);
            }

            else if (isSequence(init)) {
                let _init = Array.isArray(init) ? init : Array.from<[string, string]>(init);
                for (let i = 0; i < _init.length; ++i) {
                    let item = _init[i]!;
                    if (isSequence(item)) {
                        let pair = Array.isArray(item) ? item : Array.from<string>(item) as [string, string];
                        if (pair.length === 2) {
                            Headers_append(this, pair[0], pair[1]);
                        } else {
                            throw new TypeError("Failed to construct 'Headers': Invalid value");
                        }
                    } else {
                        throw new TypeError("Failed to construct 'Headers': The provided value cannot be converted to a sequence.");
                    }
                }
            }

            else {
                if (init && typeof init === "object") {
                    Object.getOwnPropertyNames(init).forEach(name => { Headers_append(this, name, init[name]!); }, this);
                } else {
                    throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(record<ByteString, ByteString> or sequence<sequence<ByteString>>)'.");
                }
            }
        }
    }

    /** @internal */ declare readonly __Headers__: HeadersState;

    append(name: string, value: string): void {
        checkArgsFn(arguments.length, 2, "append");
        Headers_append(this, name, value, "append");
    }

    delete(name: string): void {
        checkArgsFn(arguments.length, 1, "delete");
        delete state(this).dict[normalizeName(name, throwsFn("delete"))];
    }

    get(name: string): string | null {
        checkArgsFn(arguments.length, 1, "get");
        return state(this).dict[normalizeName(name, throwsFn("get"))] ?? null;
    }

    getSetCookie(): string[] {
        let value = this.get("Set-Cookie");
        return value ? value.split(", ") : [];
    }

    has(name: string): boolean {
        checkArgsFn(arguments.length, 1, "has");
        return state(this).dict.hasOwnProperty(normalizeName(name, throwsFn("has")));
    }

    set(name: string, value: string): void {
        checkArgsFn(arguments.length, 2, "set");
        state(this).dict[normalizeName(name, throwsFn("set"))] = normalizeValue(value);
    }

    forEach(callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any): void {
        checkArgsFn(arguments.length, 1, "forEach");
        if (typeof callbackfn !== "function") {
            throw new TypeError("Failed to execute 'forEach' on 'Headers': parameter 1 is not of type 'Function'.");
        }
        let names = Object.getOwnPropertyNames(state(this).dict);
        for (let i = 0; i < names.length; ++i) {
            let name = names[i]!;
            callbackfn.call(thisArg, state(this).dict[name]!, name, this);
        }
    }

    entries(): HeadersIterator<[string, string]> {
        let array: [string, string][] = [];
        this.forEach((value, name) => { array.push([name, value]); });
        return array.values();
    }

    keys(): HeadersIterator<string> {
        let array: string[] = [];
        this.forEach((value, name) => { array.push(name); });
        return array.values();
    }

    values(): HeadersIterator<string> {
        let array: string[] = [];
        this.forEach((value, name) => { array.push(value); });
        return array.values();
    }

    /** @internal */
    [SymbolP.iterator](): HeadersIterator<[string, string]> {
        return this.entries();
    }

    /** @internal */ toString() { return "[object Headers]"; }
    /** @internal */ get [SymbolP.toStringTag]() { return "Headers"; }
    /** @internal */ get __MPHTTPX__() { return { chain: ["Headers"] }; }
}

/** @internal */
class HeadersState {
    dict: Record<string, string> = {};
}

function state(target: HeadersP) {
    return target.__Headers__;
}

/** @internal */
export function isHeaders(value: unknown): value is Headers {
    return isPolyfillType<Headers>("Headers", value) || isExternalHeaders(value);
}

function isExternalHeaders(value: unknown): value is Headers {
    let expect = "[object Headers]";
    return (Object.prototype.toString.call(value) === expect || String(value) === expect)
        && "forEach" in (value as object)
        && typeof (value as (object & Record<"forEach", unknown>)).forEach === "function";
}

function Headers_append(headers: HeadersP, name: string, value: string, kind = "constructor") {
    let _name = normalizeName(name, kind ? throwsFn(kind) : undefined);
    let _value = normalizeValue(value);
    let dict = state(headers).dict;
    let oldValue = dict[_name];
    dict[_name] = oldValue !== undefined ? `${oldValue}, ${_value}` : _value;
}

function throwsFn(kind: string) {
    return () => {
        throw new TypeError(`Failed to ${(kind && kind !== "constructor") ? ("execute '" + kind + "' on") : "construct"} 'Headers': Invalid name`);
    };
}

function checkArgsFn(actual: number, expect: number, funcName: string) {
    checkArgsLength(actual, expect, "Headers", funcName);
}

/** @internal */
export function normalizeName(name: string, throwError?: () => never) {
    if (typeof name !== "string") { name = "" + name; }
    if (throwError && (/[^a-z0-9\-#$%&'*+.^_`|~!]/i.test(name) || name === "")) {
        throwError();
    }
    return name.toLowerCase();
}

/** @internal */
export function normalizeValue(value: string) {
    return typeof value === "string" ? value : ("" + value);
}

const HeadersE = g.Headers || HeadersP;
export { HeadersE as Headers };
