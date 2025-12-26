import { g, polyfill, isObjectType, dfStringTag } from "./isPolyfill";

/** @internal */
const state = Symbol(/* "URLSearchParamsState" */);

export class URLSearchParamsP implements URLSearchParams {
    constructor(init?: string[][] | Record<string, string> | string | URLSearchParams) {
        this[state] = new URLSearchParamsState();
        let search = init || "";

        if (isObjectType<URLSearchParams>("URLSearchParams", search)) {
            if (search instanceof URLSearchParamsP) {
                let source = search[state][_urlspArray];
                let destination = this[state][_urlspArray];
                for (let i = 0; i < source.length; ++i) {
                    let item = source[i]!;
                    destination.push([item[0], item[1]]);
                }
            } else {
                search.forEach((value, name) => {
                    this.append(name, value);
                });
            }
        } else {
            this[state][_urlspArray] = parseToArray(search);
        }
    }

    /** @internal */
    [state]: URLSearchParamsState;

    get size() { return this[state][_urlspArray].length; }

    append(name: string, value: string): void {
        this[state][_urlspArray].push([String(name), normalizeValue(value)]);
    }

    delete(...args: [name: string, value?: string]): void {
        const [name, value] = args;
        let _name = String(name);
        let source = this[state][_urlspArray];
        let destination: [string, string][] = [];
        for (let i = 0; i < source.length; ++i) {
            let item = source[i]!;
            if (_name === item[0]) {
                if (args.length !== 1 && normalizeValue(value) !== item[1]) {
                    destination.push(item);
                }
                continue;
            }
            destination.push(item);
        }
        this[state][_urlspArray] = destination;
    }

    get(name: string): string | null {
        let _name = String(name);
        let array = this[state][_urlspArray];
        for (let i = 0; i <array.length; ++i) {
            let item = array[i]!;
            if (_name === item[0]) {
                return item[1];
            }
        }
        return null;
    }

    getAll(name: string): string[] {
        let _name = String(name);
        let source = this[state][_urlspArray];
        let results: string[] = [];
        for (let i = 0; i < source.length; ++i) {
            let item = source[i]!;
            if (_name === item[0]) {
                results.push(item[1]);
            }
        }
        return results;
    }

    has(...args: [name: string, value?: string]): boolean {
        const [name, value] = args;
        let _name = String(name);
        let source = this[state][_urlspArray];
        for (let i = 0; i < source.length; ++i) {
            let item = source[i]!;
            if (_name === item[0]) {
                if (args.length === 1) {
                    return true;
                } else {
                    if (normalizeValue(value) === item[1]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    set(name: string, value: string): void {
        let _name = String(name);
        let source = this[state][_urlspArray];
        let destination: [string, string][] = [];
        let index = -1;
        for (let i = 0; i < source.length; ++i) {
            let item = source[i]!
            if (_name === item[0]) {
                if (index === -1) {
                    index = i;
                    destination.push([_name, normalizeValue(value)]);
                }
                continue;
            }
            destination.push(item);
        }
        if (index === -1) {
            destination.push([_name, normalizeValue(value)]);
        }
        this[state][_urlspArray] = destination;
    }

    sort(): void {
        this[state][_urlspArray].sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
    }

    forEach(callbackfn: (value: string, key: string, parent: URLSearchParams) => void, thisArg?: any): void {
        let source = this[state][_urlspArray];
        for (let i = 0; i < source.length; ++i) {
            let item = source[i]!;
            callbackfn.call(thisArg, item[1], item[0], this);
        }
    }

    entries() {
        return this[state][_urlspArray].map(x => [x[0], x[1]] as [string, string]).values();
    }

    keys() {
        return this[state][_urlspArray].map(x => x[0]).values();
    }

    values() {
        return this[state][_urlspArray].map(x => x[1]).values();
    }

    [Symbol.iterator]() {
        return this.entries();
    }

    toString(): string {
        let source = this[state][_urlspArray];
        let results: string[] = [];
        for (let i = 0; i < source.length; ++i) {
            let item = source[i]!;
            results.push(encode(item[0]) + "=" + encode(item[1]));
        }
        return results.join("&");
    }

    get isPolyfill() { return { symbol: polyfill, hierarchy: ["URLSearchParams"] }; }
}

dfStringTag(URLSearchParamsP, "URLSearchParams");

/** @internal */
const _urlspArray = Symbol();

/** @internal */
class URLSearchParamsState {
    [_urlspArray]: [string, string][] = [];
}

function normalizeValue(value?: string) {
    return typeof value === "string" ? value : (
        value !== null && value !== undefined && typeof (value as object).toString === "function"
            ? (value as object).toString()
            : JSON.stringify(value)
    );
}

function encode(str: string) {
    const replace: Record<string, string> = {
        "!": "%21",
        "'": "%27",
        "(": "%28",
        ")": "%29",
        "~": "%7E",
        "%20": "+",
        "%00": "\x00",
    };
    return encodeURIComponent(str).replace(/[!'\(\)~]|%20|%00/g, match => replace[match]!);
}

function decode(str: string) {
    return str
        .replace(/[ +]/g, "%20")
        .replace(/(%[a-f0-9]{2})+/ig, match => decodeURIComponent(match));
}

function parseToArray(search: string[][] | Record<string, string> | string) {
    let array: [string, string][] = [];

    if (typeof search === "object") {
        if (Array.isArray(search) || Symbol.iterator in search) {
            let _search = search as string[][];
            let records = Array.isArray(_search) ? _search : Array.from<string[]>(_search);
            for (let i = 0; i < records.length; ++i) {
                let item = records[i]! as [string, string];
                if (Array.isArray(item) || Symbol.iterator in item) {
                    let record = Array.isArray(item) ? item : Array.from<string>(item) as [string, string];
                    if (record.length === 2) {
                        array.push([String(record[0]), normalizeValue(record[1])]);
                    } else {
                        throw new TypeError("Failed to construct 'URLSearchParams': Sequence initializer must only contain pair elements");
                    }
                } else {
                    throw new TypeError("Failed to construct 'URLSearchParams': The provided value cannot be converted to a sequence.");
                }
            }
        } else {
            let _search = search as Record<string, string>;
            let keys = Object.getOwnPropertyNames(_search);
            for (let i = 0; i < keys.length; ++i) {
                let key = keys[i]!;
                if (_search.hasOwnProperty(key)) {
                    array.push([key, normalizeValue(_search[key])]);
                }
            }
        }
    } else {
        let str = typeof search === "string" ? search : String(search);
        if (str.indexOf("?") === 0) {
            str = str.slice(1);
        }

        let pairs = str.split("&");
        for (let i = 0; i < pairs.length; ++i) {
            let value = pairs[i]!, index = value.indexOf("=");

            if (index > -1) {
                array.push([decode(value.slice(0, index)), decode(value.slice(index + 1))]);
            } else {
                if (value) {
                    array.push([decode(value), ""]);
                }
            }
        }
    }

    return array;
}

const URLSearchParamsE = g["URLSearchParams"] || URLSearchParamsP;
export { URLSearchParamsE as URLSearchParams };
