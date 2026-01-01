import { g, polyfill, Class_setStringTag, checkArgs, isObjectType } from "./isPolyfill";

/** @internal */
const state = Symbol(/* "URLSearchParamsState" */);

export class URLSearchParamsP implements URLSearchParams {
    constructor(init?: string[][] | Record<string, string> | string | URLSearchParams) {
        this[state] = new URLSearchParamsState();

        if (init !== undefined) {
            if (isObjectType<URLSearchParams>("URLSearchParams", init)) {
                init.forEach((value, name) => { this.append(name, value); }, this);
            }

            else if (init && typeof init === "object") {
                if (Array.isArray(init) || Symbol.iterator in init) {
                    let _init = Array.isArray(init) ? init : Array.from<string[]>(init as never);
                    for (let i = 0; i < _init.length; ++i) {
                        let item = _init[i]! as [string, string];
                        if (Array.isArray(item) || (item && typeof item === "object" && Symbol.iterator in item)) {
                            let pair = Array.isArray(item) ? item : Array.from<string>(item as never) as [string, string];
                            if (pair.length === 2) {
                                this.append(pair[0], pair[1]);
                            } else {
                                throw new TypeError("Failed to construct 'URLSearchParams': Sequence initializer must only contain pair elements");
                            }
                        } else {
                            throw new TypeError("Failed to construct 'URLSearchParams': The provided value cannot be converted to a sequence.");
                        }
                    }
                } else {
                    Object.getOwnPropertyNames(init).forEach(name => { this.append(name, init[name]!); }, this);
                }
            }

            else {
                let _init = "" + init;
                if (_init.indexOf("?") === 0) { _init = _init.slice(1); }

                let pairs = _init.split("&");
                for (let i = 0; i < pairs.length; ++i) {
                    let pair = pairs[i]!, separatorIndex = pair.indexOf("=");

                    if (separatorIndex > -1) {
                        this.append(decode(pair.slice(0, separatorIndex)), decode(pair.slice(separatorIndex + 1)));
                    } else {
                        if (pair) {
                            this.append(decode(pair), "");
                        }
                    }
                }
            }
        }
    }

    /** @internal */
    [state]: URLSearchParamsState;

    get size() { return this[state][_urlspArray].length; }

    append(...args: [string, string]): void {
        const [name, value] = args;
        checkArgs(args, "", "append", 2);
        this[state][_urlspArray].push(["" + name, normalizeValue(value)]);
    }

    delete(...args: [string, string?]): void {
        const [name, value] = args;
        checkArgs(args, "URLSearchParams", "delete", 1);
        let _name = "" + name;
        let index = -1;
        let array = this[state][_urlspArray];
        let result: [string, string][] = [];
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!;
            if (item[0] === _name) {
                if (args.length !== 1 && item[1] !== normalizeValue(value)) {
                    result.push(item);
                }
                index = i;
                continue;
            }
            result.push(item);
        }
        if (index > -1) { this[state][_urlspArray] = result; }
    }

    get(...args: [string]): string | null {
        const [name] = args;
        checkArgs(args, "URLSearchParams", "get", 1);
        let _name = "" + name;
        let array = this[state][_urlspArray];
        for (let i = 0; i <array.length; ++i) {
            let item = array[i]!;
            if (item[0] === _name) { return item[1]; }
        }
        return null;
    }

    getAll(...args: [string]): string[] {
        const [name] = args;
        checkArgs(args, "URLSearchParams", "getAll", 1);
        let _name = "" + name;
        let array = this[state][_urlspArray];
        let result: string[] = [];
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!;
            if (item[0] === _name) { result.push(item[1]); }
        }
        return result;
    }

    has(...args: [string, string?]): boolean {
        const [name, value] = args;
        checkArgs(args, "URLSearchParams", "has", 1);
        let _name = "" + name;
        let array = this[state][_urlspArray];
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!;
            if (item[0] === _name) {
                if (args.length === 1) {
                    return true;
                } else {
                    if (item[1] === normalizeValue(value)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    set(...args: [string, string]): void {
        const [name, value] = args;
        checkArgs(args, "URLSearchParams", "set", 2);
        let _name = "" + name;
        let _value = normalizeValue(value);
        let index = -1;
        let array = this[state][_urlspArray];
        let result: [string, string][] = [];
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!
            if (item[0] === _name) {
                if (index === -1) {
                    index = i;
                    result.push([_name, _value]);
                }
                continue;
            }
            result.push(item);
        }
        if (index === -1) {
            result.push([_name, _value]);
        }
        this[state][_urlspArray] = result;
    }

    sort(): void {
        this[state][_urlspArray].sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
    }

    forEach(...args: [(value: string, key: string, parent: URLSearchParams) => void, any?]): void {
        const [callbackfn, thisArg] = args;
        checkArgs(args, "URLSearchParams", "forEach", 1);
        if (typeof callbackfn !== "function") {
            throw new TypeError("Failed to execute 'forEach' on 'URLSearchParams': parameter 1 is not of type 'Function'.");
        }
        let array = this[state][_urlspArray];
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!;
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
        let array = this[state][_urlspArray];
        let result: string[] = [];
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!;
            result.push(encode(item[0]) + "=" + encode(item[1]));
        }
        return result.join("&");
    }

    /** @internal */
    get isPolyfill() { return { symbol: polyfill, hierarchy: ["URLSearchParams"] }; }
}

Class_setStringTag(URLSearchParamsP, "URLSearchParams");

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

const URLSearchParamsE = g["URLSearchParams"] || URLSearchParamsP;
export { URLSearchParamsE as URLSearchParams };
