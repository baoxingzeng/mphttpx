import { g, polyfill, isObjectType, dfStringTag } from "./isPolyfill";

/** @internal */
const state = Symbol(/* "URLSearchParamsState" */);

export class URLSearchParamsP implements URLSearchParams {
    constructor(init?: string[][] | Record<string, string> | string | URLSearchParams) {
        this[state] = new URLSearchParamsState();
        let search = init || "";

        if (search instanceof URLSearchParamsP) {
            let source = search[state][_urlspDict];
            let destination = this[state][_urlspDict];
            let keys = Object.getOwnPropertyNames(source);
            for (let i = 0; i < keys.length; ++i) {
                let key = keys[i]!;
                let values = source[key]!;
                let vals: string[] = [];
                for (let j = 0; j < values.length; ++j) {
                    let val = values[j]!;
                    vals.push(val);
                }
                destination[key] = vals;
            }
        } else {
            if (isObjectType<URLSearchParams>("URLSearchParams", search)) {
                search = search.toString();
            }
            this[state][_urlspDict] = parseToDict(search);
        }
    }

    /** @internal */
    [state]: URLSearchParamsState;

    get size() {
        let count = 0;
        let dict = this[state][_urlspDict];
        let keys = Object.getOwnPropertyNames(dict);
        for (let i = 0; i < keys.length; ++i) {
            let key = keys[i]!;
            let values = dict[key]!;
            count += values.length;
        }
        return count;
    }

    append(name: string, value: string): void {
        appendTo(this[state][_urlspDict], name, value);
    }

    delete(name: string, value?: string): void {
        let source = this[state][_urlspDict];
        let destination: Record<string, string[]> = {};
        let keys = Object.getOwnPropertyNames(source);
        for (let i = 0; i < keys.length; ++i) {
            let key = keys[i]!;
            let values = source[key]!;
            if (key === name) {
                if (value !== undefined) {
                    let vals = values.filter(x => x !== ("" + value));
                    if (vals.length > 0) { destination[key] = vals; }
                }
                continue;
            }
            destination[key] = values;
        }
        this[state][_urlspDict] = destination;
    }

    get(name: string): string | null {
        return this.has(name) ? this[state][_urlspDict][name]![0] ?? null : null;
    }

    getAll(name: string): string[] {
        return this.has(name) ? this[state][_urlspDict][name]!.slice(0) : [];
    }

    has(name: string, value?: string): boolean {
        if (hasOwnProperty(this[state][_urlspDict], name)) {
            if (value !== undefined) {
                return this[state][_urlspDict][name]!.indexOf(("" + value)) > -1;
            }
            return true;
        }
        return false;
    }

    set(name: string, value: string): void {
        this[state][_urlspDict][name] = ["" + value];
    }

    sort(): void {
        const that = this[state];
        let keys = Object.getOwnPropertyNames(that[_urlspDict]); keys.sort();
        let dict: Record<string, string[]> = {};

        for (let i = 0; i < keys.length; ++i) {
            let key = keys[i]!;
            Object.assign(dict, { [key]: that[_urlspDict][key] });
        }

        that[_urlspDict] = dict;
    }

    forEach(callbackfn: (value: string, key: string, parent: URLSearchParams) => void, thisArg?: any): void {
        let dict = this[state][_urlspDict];
        let keys = Object.getOwnPropertyNames(dict);
        for (let i = 0; i < keys.length; ++i) {
            let key = keys[i]!;
            let values = dict[key]!;
            for (let j = 0; j < values.length; ++j) {
                let value = values[j]!;
                callbackfn.call(thisArg, value, key, this);
            }
        }
    }

    entries() {
        let destination: [string, string][] = [];
        let dict = this[state][_urlspDict];
        let keys = Object.getOwnPropertyNames(dict);
        for (let i = 0; i < keys.length; ++i) {
            let key = keys[i]!;
            let values = dict[key]!
            for (let j = 0; j < values.length; ++j) {
                let value = values[j]!;
                destination.push([key, value]);
            }
        }
        return destination.values();
    }

    keys() {
        return Object.getOwnPropertyNames(this[state][_urlspDict]).values();
    }

    values() {
        let results: string[] = [];
        let dict = this[state][_urlspDict];
        let keys = Object.getOwnPropertyNames(dict);
        for (let i = 0; i < keys.length; ++i) {
            let key = keys[i]!;
            let cur = dict[key]!;
            for (let j = 0; j < cur.length; ++j) {
                let val = cur[j]!
                results.push(val);
            }
        }
        return results.values();
    }

    [Symbol.iterator]() {
        return this.entries();
    }

    toString(): string {
        let query: string[] = [];
        let dict = this[state][_urlspDict];
        let keys = Object.getOwnPropertyNames(dict);
        for (let i = 0; i < keys.length; ++i) {
            let key = keys[i]!;
            let name = encode(key);
            let values = dict[key]!;
            for (let j = 0; j < values.length; ++j) {
                let val = values[j]!;
                query.push(name + "=" + encode(val));
            }
        }
        return query.join("&");
    }

    get isPolyfill() { return { symbol: polyfill, hierarchy: ["URLSearchParams"] }; }
}

dfStringTag(URLSearchParamsP, "URLSearchParams");

/** @internal */
const _urlspDict = Symbol();

/** @internal */
class URLSearchParamsState {
    [_urlspDict]: Record<string, string[]> = {};
}

function parseToDict(search: string[][] | Record<string, string> | string) {
    let dict: Record<string, string[]> = {};

    if (typeof search === "object") {
        // if `search` is an array, treat it as a sequence
        if (Symbol.iterator in search) {
            let records = Array.isArray(search) ? search : Array.from<string[]>(search);
            for (let i = 0; i < records.length; ++i) {
                let item = records[i]!;
                if (Symbol.iterator in item) {
                    let record = Array.isArray(item) ? item : Array.from<string>(item);
                    if (record.length === 2) {
                        appendTo(dict, record[0]!, record[1]!);
                    } else {
                        throw new TypeError("Failed to construct 'URLSearchParams': Sequence initializer must only contain pair elements");
                    }
                } else {
                    throw new TypeError("Failed to construct 'URLSearchParams': The provided value cannot be converted to a sequence.");
                }
            }
        } else {
            let keys = Object.getOwnPropertyNames(search);
            for (let i = 0; i < keys.length; ++i) {
                let key = keys[i]!
                if (search.hasOwnProperty(key)) {
                    appendTo(dict, key, search[key]!);
                }
            }
        }
    } else {
        let str = typeof search === "string" ? search : String(search);
        // remove first '?'
        if (str.indexOf("?") === 0) {
            str = str.slice(1);
        }

        let pairs = str.split("&");
        for (let j = 0; j < pairs.length; ++j) {
            let value = pairs[j], index = value!.indexOf("=");

            if (-1 < index) {
                appendTo(dict, decode(value!.slice(0, index)), decode(value!.slice(index + 1)));
            } else {
                if (value) {
                    appendTo(dict, decode(value), "");
                }
            }
        }
    }

    return dict;
}

function appendTo(dict: Record<string, string[]>, name: string, value: string) {
    let val = typeof value === "string" ? value : (
        value !== null && value !== undefined && typeof (value as object).toString === "function" ? (value as object).toString() : JSON.stringify(value)
    );

    // Prevent using `hasOwnProperty` as a property name
    if (hasOwnProperty(dict, name)) {
        dict[name]!.push(val);
    } else {
        dict[name] = [val];
    }
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

function hasOwnProperty(obj: object, prop: PropertyKey) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}

const URLSearchParamsE = g["URLSearchParams"] || URLSearchParamsP;
export { URLSearchParamsE as URLSearchParams };
