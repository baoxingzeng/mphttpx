import { g, polyfill, isObjectType, dfStringTag } from "./isPolyfill";

/** @internal */
const state = Symbol(/* "HeadersState" */);

export class HeadersP implements Headers {
    constructor(init?: HeadersInit) {
        this[state] = new HeadersState();

        if (init) {
            if (isObjectType<Headers>("Headers", init)) {
                if (init instanceof HeadersP) {
                    let source = init[state][_headersArray];
                    let destination = this[state][_headersArray];
                    for (let i = 0; i < source.length; ++i) {
                        let item = source[i]!;
                        destination.push([item[0], [item[1][0], item[1][1]]]);
                    }
                } else {
                    init.forEach((value, name) => {
                        this.append(name, value);
                    });
                }
            } else if (Array.isArray(init) || Symbol.iterator in init) {
                let _init = init as string[][];
                let headers = Array.isArray(_init) ? _init : Array.from<[string, string]>(_init);
                for (let i = 0; i < headers.length; ++i) {
                    let record = headers[i]!;
                    if (Array.isArray(record) || Symbol.iterator in record) {
                        let header = Array.isArray(record) ? record : Array.from(record) as [string, string];
                        if (header.length !== 2) {
                            throw new TypeError("Failed to construct 'Headers': Invalid value");
                        }
                        this.append(header[0]!, header[1]!);
                    } else {
                        throw new TypeError("Failed to construct 'Headers': The provided value cannot be converted to a sequence.");
                    }
                }
            } else {
                if (typeof init !== "object") {
                    throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(record<ByteString, ByteString> or sequence<sequence<ByteString>>)'.");
                }
                let _init = init as Record<string, string>;
                let keys = Object.getOwnPropertyNames(_init);
                for (let i = 0; i < keys.length; ++i) {
                    let key = keys[i]!;
                    this.append(key, _init[key]!);
                }
            }
        }
    }

    /** @internal */
    [state]: HeadersState;

    append(name: string, value: string): void {
        let key = normalizeName(name, "append");
        let newValue = normalizeValue(value);
        let index = -1;
        let array = this[state][_headersArray];
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!;
            if (key === item[0]) {
                item[1] = ["" + name, item[1][1] + `, ${newValue}`];
                index = i;
                break;
            }
        }
        if (index === -1) { array.push([key, ["" + name, newValue]]); }
    }

    delete(name: string): void {
        let key = normalizeName(name, "delete");
        let index = -1;
        let source = this[state][_headersArray];
        let destination: [string, [string, string]][] = [];
        for (let i = 0; i < source.length; ++i) {
            let item = source[i]!;
            if (key === item[0]) { index = i; continue; }
            destination.push(item);
        }
        if (index > -1) { this[state][_headersArray] = destination; }
    }

    get(name: string): string | null {
        let key = normalizeName(name, "get");
        let array = this[state][_headersArray];
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!;
            if (key === item[0]) { return item[1][1]; }
        }
        return null;
    }

    getSetCookie(): string[] {
        let value = this.get("Set-Cookie");
        return value ? value.split(", ") : [];
    }

    has(name: string): boolean {
        let key = normalizeName(name, "has");
        let array = this[state][_headersArray];
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!;
            if (key === item[0]) { return true; }
        }
        return false;
    }

    set(name: string, value: string): void {
        let key = normalizeName(name, "set");
        let index = -1;
        let array = this[state][_headersArray];
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!;
            if (key === item[0]) {
                item[1] = ["" + name, normalizeName(value)];
                index = i;
                break;
            }
        }
        if (index === -1) { array.push([key, ["" + name, normalizeName(value)]]); }
    }

    forEach(callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any): void {
        let array = this[state][_headersArray];
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!
            let key = item[0];
            let pair = item[1];
            callbackfn.call(thisArg, pair[1], key, this);
        }
    }

    entries() {
        return this[state][_headersArray].map(x => [x[0], x[1][1]] as [string, string]).values();
    }

    keys() {
        return this[state][_headersArray].map(x => x[0]).values();
    }

    values() {
        return this[state][_headersArray].map(x => x[1][1]).values();
    }

    [Symbol.iterator]() {
        return this.entries();
    }

    toString() { return "[object Headers]"; }
    get isPolyfill() { return { symbol: polyfill, hierarchy: ["Headers"] }; }
}

dfStringTag(HeadersP, "Headers");

/** @internal */
const _headersArray = Symbol();

/** @internal */
class HeadersState {
    [_headersArray]: [string, [string, string]][] = [];
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
export function XHR_setRequestHeaders(xhr: XMLHttpRequest, request: Request, init?: RequestInit) {
    let array = (request.headers as HeadersP)[state][_headersArray];
    if (init && typeof init === "object" && isObjectHeaders(init.headers)) {
        let headers = init.headers;
        let names: string[] = [];

        let keys = Object.getOwnPropertyNames(headers);
        for (let i = 0; i < keys.length; ++i) {
            let name = keys[i]!;
            names.push(normalizeName(name));
            xhr.setRequestHeader(name, normalizeValue(headers[name]!));
        }

        for (let i = 0; i < array.length; ++i) {
            let name = array[i]![0];
            let pair = array[i]![1];
            if (names.indexOf(name) === -1) {
                xhr.setRequestHeader(pair[0], pair[1]);
            }
        }
    } else {
        for (let i = 0; i < array.length; ++i) {
            let pair = array[i]![1];
            xhr.setRequestHeader(pair[0], pair[1]);
        }
    }
}

function isObjectHeaders(val: unknown): val is Record<string, string> {
    return typeof val === "object" && !isObjectType<Headers>("Headers", val);
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
export function Headers_toDict(headers: Headers) {
    let dict: Record<string, string> = {};
    let array = (headers as HeadersP)[state][_headersArray];
    for (let i = 0; i < array.length; ++i) {
        let pair = array[i]![1];
        dict[pair[0]] = pair[1];
    }
    return dict;
}

/** @internal */
export function createHeadersFromDict(records: Record<string, string>): Headers {
    let headers = new HeadersP();
    let array = headers[state][_headersArray];
    let names = Object.getOwnPropertyNames(records);
    for (let i = 0; i < names.length; ++i) {
        let name = names[i]!;
        let key = normalizeName(name, "set");
        array.push([key, [name, records[name]!]]);
    }
    return headers;
}

const HeadersE = g["Headers"] || HeadersP;
export { HeadersE as Headers };
