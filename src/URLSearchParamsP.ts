import { g, polyfill, isObjectType, defineStringTag, objectValues, objectEntries } from "./isPolyfill";

const state = Symbol(/* "URLSearchParamsState" */);

export class URLSearchParamsP implements URLSearchParams {
    constructor(init?: string[][] | Record<string, string> | string | URLSearchParams) {
        let search = init || "";

        if (isObjectType<URLSearchParams>("URLSearchParams", search)) {
            search = search.toString();
        }

        this[state] = new URLSearchParamsState();
        this[state][_urlspDict] = parseToDict(search);
    }

    [state]: URLSearchParamsState;

    get size() {
        return objectValues(this[state][_urlspDict]).reduce((acc, cur) => acc + cur.length, 0);
    }

    append(name: string, value: string): void {
        appendTo(this[state][_urlspDict], name, value);
    }

    delete(name: string, value?: string): void {
        let dict: Record<string, string[]> = {};
        for (let [key, values] of objectEntries(this[state][_urlspDict])) {
            if (key === name) {
                if (value !== undefined) {
                    let vals = values.filter(x => x !== ("" + value));
                    if (vals.length > 0) Object.assign(dict, { [key]: vals });
                }
                continue;
            }
            Object.assign(dict, { [key]: values });
        }

        this[state][_urlspDict] = dict;
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
        let keys = Object.keys(that[_urlspDict]);
        keys.sort();

        let dict: Record<string, string[]> = {};
        for (let key of keys) {
            Object.assign(dict, { [key]: that[_urlspDict][key] });
        }

        that[_urlspDict] = dict;
    }

    forEach(callbackfn: (value: string, key: string, parent: URLSearchParams) => void, thisArg?: any): void {
        objectEntries(this[state][_urlspDict]).forEach(([key, values]) => {
            values.forEach(value => {
                callbackfn.call(thisArg, value, key, this);
            });
        });
    }

    entries() {
        return objectEntries(this[state][_urlspDict])
            .map(([key, values]) => {
                return values.map(value => {
                    return [key, value] as [string, string];
                });
            })
            .reduce(flatCb, [])
            .values();
    }

    keys() {
        return Object.keys(this[state][_urlspDict]).values();
    }

    values() {
        return objectValues(this[state][_urlspDict]).reduce(flatCb, []).values();
    }

    [Symbol.iterator]() {
        return this.entries();
    }

    toString(): string {
        let query: string[] = [];
        for (let [key, values] of objectEntries(this[state][_urlspDict])) {
            let name = encode(key);
            for (let val of values) {
                query.push(name + "=" + encode(val));
            }
        }

        return query.join("&");
    }

    get isPolyfill() { return { symbol: polyfill, hierarchy: ["URLSearchParams"] }; }
}

defineStringTag(URLSearchParamsP, "URLSearchParams");

const _urlspDict = Symbol();

class URLSearchParamsState {
    [_urlspDict]: Record<string, string[]> = {};
}

function parseToDict(search: string[][] | Record<string, string> | string) {
    let dict: Record<string, string[]> = {};

    if (typeof search === "object") {
        // if `search` is an array, treat it as a sequence
        if (Array.isArray(search)) {
            for (let i = 0; i < search.length; ++i) {
                let item = search[i];
                if (Array.isArray(item) && item.length === 2) {
                    appendTo(dict, item[0]!, item[1]!);
                } else {
                    throw new TypeError("Failed to construct 'URLSearchParams': Sequence initializer must only contain pair elements");
                }
            }
        } else {
            for (let key in search) {
                if (search.hasOwnProperty(key)) {
                    appendTo(dict, key, search[key]!);
                }
            }
        }
    } else {
        // remove first '?'
        if (search.indexOf("?") === 0) {
            search = search.slice(1);
        }

        let pairs = search.split("&");
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

function flatCb<T>(acc: T[], cur: T[]) {
    for (let item of cur) { acc.push(item); }
    return acc;
}

const URLSearchParamsE = g["URLSearchParams"] || URLSearchParamsP;
export { URLSearchParamsE as URLSearchParams };
