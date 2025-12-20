import { g, polyfill, isObjectType, dfStringTag } from "./isPolyfill";

/** @internal */
const state = Symbol(/* "HeadersState" */);

export class HeadersP implements Headers {
    constructor(init?: HeadersInit) {
        this[state] = new HeadersState();

        if (!!init) {
            if (isObjectType<Headers>("Headers", init)) {
                if (init instanceof HeadersP) {
                    let source = init[state][_headersMap].array;
                    let destination = this[state][_headersMap].array;
                    for (let i = 0; i < source.length; ++i) {
                        let item = source[i]!;
                        destination.push([item[0], [item[1][0], item[1][1]]]);
                    }
                } else {
                    init.forEach((value, name) => {
                        this.append(name, value);
                    });
                }
            } else if (Symbol.iterator in init) {
                let headers = Array.isArray(init) ? init : Array.from<[string, string]>(init);
                for (let i = 0; i < headers.length; ++i) {
                    let record = headers[i]!;
                    if (Symbol.iterator in record) {
                        let header = Array.isArray(record) ? record : Array.from(record) as [string, string];
                        if (header.length !== 2) {
                            throw new TypeError("Failed to construct 'Headers': Invalid value");
                        }
                        this.append(header[0], header[1]);
                    } else {
                        throw new TypeError("Failed to construct 'Headers': The provided value cannot be converted to a sequence.");
                    }
                }
            } else {
                if (typeof init !== "object") {
                    throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(record<ByteString, ByteString> or sequence<sequence<ByteString>>)'.");
                }
                let keys = Object.getOwnPropertyNames(init);
                for (let i = 0; i < keys.length; ++i) {
                    let key = keys[i]!;
                    this.append(key, init[key]!);
                }
            }
        }
    }

    /** @internal */
    [state]: HeadersState;

    append(name: string, value: string): void {
        let key = normalizeName(name, "append");
        let newValue = normalizeValue(value);

        let oldValue = this[state][_headersMap].get(key)?.[1];
        this[state][_headersMap].set(key, ["" + name, oldValue ? `${oldValue}, ${newValue}` : newValue]);
    }

    delete(name: string): void {
        let key = normalizeName(name, "delete");
        this[state][_headersMap].delete(key);
    }

    get(name: string): string | null {
        let key = normalizeName(name, "get");
        return this[state][_headersMap].get(key)?.[1] ?? null;
    }

    getSetCookie(): string[] {
        let value = this.get("Set-Cookie");
        return value ? value.split(", ") : [];
    }

    has(name: string): boolean {
        let key = normalizeName(name, "has");
        return this[state][_headersMap].has(key);
    }

    set(name: string, value: string): void {
        let key = normalizeName(name, "set");
        this[state][_headersMap].set(key, ["" + name, normalizeValue(value)]);
    }

    forEach(callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any): void {
        let array = this[state][_headersMap].array;
        for (let i = 0; i < array.length; ++i) {
            let pair = array[i]![1];
            callbackfn.call(thisArg, pair[1], pair[0], this);
        }
    }

    entries() {
        return this[state][_headersMap].values();
    }

    keys() {
        return Array.from(this.entries()).map(pair => pair[0]).values();
    }

    values() {
        return Array.from(this.entries()).map(pair => pair[1]).values();
    }

    [Symbol.iterator]() {
        return this.entries();
    }

    toString() { return "[object Headers]"; }
    get isPolyfill() { return { symbol: polyfill, hierarchy: ["Headers"] }; }
}

dfStringTag(HeadersP, "Headers");

/** @internal */
const _headersMap = Symbol();

/** @internal */
class HeadersState {
    [_headersMap] = new SimpleMap<string, [string, string]>();
}

/** @internal */
class SimpleMap<K, V> {
    array: [K, V][] = [];

    get(key: K): V | void {
        for (let i = 0; i < this.array.length; ++i) {
            let pair = this.array[i]!;
            if (pair[0] === key) { return pair[1]; }
        }
    }

    set(key: K, value: V) {
        let index = -1;
        for (let i = 0; i < this.array.length; ++i) {
            let pair = this.array[i]!;
            if (pair[0] === key) { pair[1] = value; index = i; break; }
        }
        if (index === -1) { this.array.push([key, value]); }
        return this.array;
    }

    has(key: K) {
        for (let i = 0; i < this.array.length; ++i) {
            let pair = this.array[i]!;
            if (pair[0] === key) { return true; }
        }
        return false;
    }

    delete(key: K) {
        let index = -1;
        let array: [K, V][] = [];
        for (let i = 0; i < this.array.length; ++i) {
            let pair = this.array[i]!;
            if (pair[0] === key) { index = i; continue; }
            array.push(pair);
        }
        if (index > -1) { this.array = array; }
        return index > -1;
    }

    values() {
        return this.array.map(x => x[1]).values();
    }
}

/** @internal */
export function normalizeName(name: string, kind = "") {
    if (typeof name !== "string") {
        name = String(name);
    }
    if (/[^a-z0-9\-#$%&'*+.^_`|~!]/i.test(name) || name === "") {
        if (kind) {
            throw new TypeError(`Failed to execute '${kind}' on 'Headers': Invalid name`);
        }
    }
    return name.toLowerCase();
}

/** @internal */
export function normalizeValue(value: string) {
    if (typeof value !== "string") {
        value = String(value);
    }
    return value;
}

/** @internal */
export function Headers_toDict(headers: Headers) {
    let dict: Record<string, string> = {};
    let array = (headers as HeadersP)[state][_headersMap].array;
    for (let i = 0; i < array.length; ++i) {
        let pair = array[i]![1];
        dict[pair[0]] = pair[1];
    }
    return dict;
}

/** @internal */
export function createHeadersFromDict(records: Record<string, string>): Headers {
    let headers = new HeadersP();
    let array = headers[state][_headersMap].array;
    let names = Object.getOwnPropertyNames(records);
    for (let i = 0; i < names.length; ++i) {
        let name = names[i]!;
        let key = normalizeName(name, "set");
        array.push([key, [name, records[name]!]]);
    }
    return headers;
}

/** @internal */
export function parseHeaders(rawHeaders: string): Headers {
    let headers = new HeadersP();
    let preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, " ");

    preProcessedHeaders
        .split("\r")
        .map(function (header) {
            return header.indexOf("\n") === 0 ? header.substring(1, header.length) : header;
        })
        .forEach(function (line) {
            let parts = line.split(":");
            let key = parts.shift()!.trim();
            if (key) {
                let value = parts.join(":").trim();
                try {
                    headers.append(key, value);
                } catch (error) {
                    console.warn("Response " + (error as Error).message);
                }
            }
        });

    return headers;
}

/** @internal */
export function XHR_setRequestHeaders(xhr: XMLHttpRequest, request: Request, init?: RequestInit) {
    if (init && typeof init === "object" && isObjectHeaders(init.headers)) {
        let headers = init.headers;
        let names: string[] = [];

        let keys = Object.getOwnPropertyNames(headers);
        for (let i = 0; i < keys.length; ++i) {
            let name = keys[i]!;
            names.push(normalizeName(name));
            xhr.setRequestHeader(name, normalizeValue(headers[name]!));
        }

        let array = (request.headers as HeadersP)[state][_headersMap].array;
        for (let i = 0; i < array.length; ++i) {
            let name = array[i]![0];
            let pair = array[i]![1];
            if (names.indexOf(name) === -1) {
                xhr.setRequestHeader(pair[0], pair[1]);
            }
        }
    } else {
        let array = (request.headers as HeadersP)[state][_headersMap].array;
        for (let i = 0; i < array.length; ++i) {
            let pair = array[i]![1];
            xhr.setRequestHeader(pair[0], pair[1]);
        }
    }
}

function isObjectHeaders(val: unknown): val is Record<string, string> {
    return typeof val === "object" && !isObjectType<Headers>("Headers", val);
}

const HeadersE = g["Headers"] || HeadersP;
export { HeadersE as Headers };
