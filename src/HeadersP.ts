import { g, polyfill, Class_setStringTag, checkArgsLength, isObjectType, isPolyfillType } from "./isPolyfill";

/** @internal */ const state = Symbol(/* "HeadersState" */);
const checkArgsFn = (args: any[], required: number, funcName: string) => { checkArgsLength(args, required, "Headers", funcName); }

export class HeadersP implements Headers {
    constructor(init?: HeadersInit) {
        this[state] = new HeadersState();

        if (init !== undefined) {
            if (isObjectType<Headers>("Headers", init) || isPolyfillType<Headers>("Headers", init)) {
                init.forEach((value, name) => { this.append(name, value); }, this);
            }

            else if (Array.isArray(init) || (init && typeof init === "object" && Symbol.iterator in init)) {
                let _init = Array.isArray(init) ? init : Array.from<[string, string]>(init as never);
                _init.forEach(item => {
                    if (Array.isArray(item) || (item && typeof item === "object" && Symbol.iterator in item)) {
                        let pair = Array.isArray(item) ? item : Array.from<string>(item as never) as [string, string];
                        if (pair.length === 2) {
                            this.append(pair[0], pair[1]);
                        } else {
                            throw new TypeError("Failed to construct 'Headers': Invalid value");
                        }
                    } else {
                        throw new TypeError("Failed to construct 'Headers': The provided value cannot be converted to a sequence.");
                    }
                }, this);
            }

            else {
                if (init && typeof init === "object") {
                    Object.getOwnPropertyNames(init).forEach(name => { this.append(name, init[name]!) }, this);
                } else {
                    throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(record<ByteString, ByteString> or sequence<sequence<ByteString>>)'.");
                }
            }
        }

        this[state][_initialized] = true;
    }

    /** @internal */
    [state]: HeadersState;

    append(...args: [string, string]): void {
        const [name, value] = args;
        checkArgsFn(args, 2, "append");
        let _name = normalizeName(name, throwsFn(this[state][_initialized] ? "append" : ""));
        let _value = normalizeValue(value);
        let index = -1;
        let array = this[state][_headersArray];
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!;
            if (item[0] === _name) {
                item[1] = `${item[1]}, ${_value}`;
                index = i;
                break;
            }
        }
        if (index === -1) { array.push([_name, _value]); }
    }

    delete(...args: [string]): void {
        const [name] = args;
        checkArgsFn(args, 1, "delete");
        let _name = normalizeName(name, throwsFn("delete"));
        let index = -1;
        let array = this[state][_headersArray];
        let result: [string, string][] = [];
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!;
            if (item[0] === _name) { index = i; continue; }
            result.push(item);
        }
        if (index > -1) { this[state][_headersArray] = result; }
    }

    get(...args: [string]): string | null {
        const [name] = args;
        checkArgsFn(args, 1, "get");
        let _name = normalizeName(name, throwsFn("get"));
        let array = this[state][_headersArray];
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!;
            if (item[0] === _name) { return item[1]; }
        }
        return null;
    }

    getSetCookie(): string[] {
        let value = this.get("Set-Cookie");
        return value ? value.split(", ") : [];
    }

    has(...args: [string]): boolean {
        const [name] = args;
        checkArgsFn(args, 1, "has");
        let _name = normalizeName(name, throwsFn("has"));
        let array = this[state][_headersArray];
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!;
            if (item[0] === _name) { return true; }
        }
        return false;
    }

    set(...args: [string, string]): void {
        const [name, value] = args;
        checkArgsFn(args, 2, "set");
        let _name = normalizeName(name, throwsFn("set"));
        let _value = normalizeValue(value);
        let index = -1;
        let array = this[state][_headersArray];
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!;
            if (item[0] === _name) {
                item[1] = _value;
                index = i;
                break;
            }
        }
        if (index === -1) { array.push([_name, _value]); }
    }

    forEach(...args: [(value: string, key: string, parent: Headers) => void, any?]): void {
        const [callbackfn, thisArg] = args;
        checkArgsFn(args, 1, "forEach");
        if (typeof callbackfn !== "function") {
            throw new TypeError("Failed to execute 'forEach' on 'Headers': parameter 1 is not of type 'Function'.");
        }
        let array = this[state][_headersArray];
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!
            callbackfn.call(thisArg, item[1], item[0], this);
        }
    }

    entries() {
        return this[state][_headersArray].map(x => [x[0], x[1]] as [string, string]).values();
    }

    keys() {
        return this[state][_headersArray].map(x => x[0]).values();
    }

    values() {
        return this[state][_headersArray].map(x => x[1]).values();
    }

    [Symbol.iterator]() {
        return this.entries();
    }

    /** @internal */ toString() { return "[object Headers]"; }
    /** @internal */ get isPolyfill() { return { symbol: polyfill, hierarchy: ["Headers"] }; }
}

Class_setStringTag(HeadersP, "Headers");

/** @internal */ const _initialized = Symbol();
/** @internal */ const _headersArray = Symbol();

/** @internal */
class HeadersState {
    [_initialized] = false;
    [_headersArray]: [string, string][] = [];
}

function throwsFn(kind: string) {
    return () => {
        throw new TypeError(`Failed to ${kind ? ("execute '" + kind + "' on") : "construct"} 'Headers': Invalid name`)
    };
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

/** @internal */
export function parseHeaders(rawHeaders: string): Headers {
    let headers = new HeadersP();
    let preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, " ");

    preProcessedHeaders
        .split("\r")
        .map(header => header.indexOf("\n") === 0 ? header.substring(1, header.length) : header)
        .forEach(line => {
            let parts = line.split(":");
            let name = parts.shift()!.trim();
            if (name) {
                let value = parts.join(":").trim();
                try {
                    headers.append(name, value);
                } catch (e) {
                    console.warn(`SyntaxError: Response.headers: '${name}' is not a valid HTTP header field name.`);
                }
            }
        });

    return headers;
}

const HeadersE = g["Headers"] || HeadersP;
export { HeadersE as Headers };
