import { g, polyfill, isObjectType, dfStringTag, objectEntries } from "./isPolyfill";

/** @internal */
const state = Symbol(/* "HeadersState" */);

export class HeadersP implements Headers {
    constructor(init?: HeadersInit) {
        this[state] = new HeadersState();

        if (isObjectType<Headers>("Headers", init)) {
            init.forEach((value, name) => {
                this.append(name, value);
            });
        } else if (Array.isArray(init)) {
            init.forEach(header => {
                if (!Array.isArray(header)) {
                    throw new TypeError("Failed to construct 'Headers': The provided value cannot be converted to a sequence.");
                }
                if (header.length !== 2) {
                    throw new TypeError("Failed to construct 'Headers': Invalid value");
                }
                this.append(header[0], header[1]);
            });
        } else if (init) {
            objectEntries(init).forEach(([name, value]) => {
                this.append(name, value);
            });
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
        Array.from(this.entries()).forEach(([name, value]) => {
            callbackfn.call(thisArg, value, name, this);
        });
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
export function parseHeaders(rawHeaders: string) {
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

const HeadersE = g["Headers"] || HeadersP;
export { HeadersE as Headers };
