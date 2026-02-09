import { SymbolP, setState, checkArgsLength } from "../utils";
import { isSequence } from "../helpers/isSequence";
import { isURLSearchParams } from "../helpers/isURLSearchParams";

export class URLSearchParamsP implements URLSearchParams {
    constructor(init?: string[][] | Record<string, string> | string | URLSearchParams) {
        setState(this, "__URLSearchParams__", new URLSearchParamsState());

        if (init !== undefined) {
            if (isURLSearchParams(init)) {
                init.forEach((value, name) => { this.append(name, value); }, this);
            }

            else if (init && typeof init === "object") {
                if (isSequence(init)) {
                    let _init = Array.isArray(init) ? init : Array.from<string[]>(init);
                    for (let i = 0; i < _init.length; ++i) {
                        let item = _init[i]! as [string, string];
                        if (isSequence(item)) {
                            let pair = Array.isArray(item) ? item : Array.from<string>(item) as [string, string];
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

    /** @internal */ declare readonly __URLSearchParams__: URLSearchParamsState;

    get size() { return state(this).array.length; }

    append(name: string, value: string): void {
        checkArgsFn(arguments.length, 2, "append");
        state(this).array.push(["" + name, normalizeValue(value)]);
    }

    delete(name: string, value?: string): void {
        checkArgsFn(arguments.length, 1, "delete");
        let _name = "" + name;
        let index = -1;
        let array = state(this).array;
        let result: [string, string][] = [];
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!;
            if (item[0] === _name) {
                if (arguments.length !== 1 && item[1] !== normalizeValue(value)) {
                    result.push(item);
                }
                index = i;
                continue;
            }
            result.push(item);
        }
        if (index > -1) { state(this).array = result; }
    }

    get(name: string): string | null {
        checkArgsFn(arguments.length, 1, "get");
        let _name = "" + name;
        let array = state(this).array;
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!;
            if (item[0] === _name) { return item[1]; }
        }
        return null;
    }

    getAll(name: string): string[] {
        checkArgsFn(arguments.length, 1, "getAll");
        let _name = "" + name;
        let array = state(this).array;
        let result: string[] = [];
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!;
            if (item[0] === _name) { result.push(item[1]); }
        }
        return result;
    }

    has(name: string, value?: string): boolean {
        checkArgsFn(arguments.length, 1, "has");
        let _name = "" + name;
        let array = state(this).array;
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!;
            if (item[0] === _name) {
                if (arguments.length === 1) {
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

    set(name: string, value: string): void {
        checkArgsFn(arguments.length, 2, "set");
        let _name = "" + name;
        let _value = normalizeValue(value);
        let index = -1;
        let array = state(this).array;
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
        state(this).array = result;
    }

    sort(): void {
        state(this).array.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
    }

    forEach(callbackfn: (value: string, key: string, parent: URLSearchParams) => void, thisArg?: any): void {
        checkArgsFn(arguments.length, 1, "forEach");
        if (typeof callbackfn !== "function") {
            throw new TypeError("Failed to execute 'forEach' on 'URLSearchParams': parameter 1 is not of type 'Function'.");
        }
        let array = state(this).array;
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!;
            callbackfn.call(thisArg, item[1], item[0], this);
        }
    }

    entries(): URLSearchParamsIterator<[string, string]> {
        return state(this).array.map(x => [x[0], x[1]] as [string, string]).values();
    }

    keys(): URLSearchParamsIterator<string> {
        return state(this).array.map(x => x[0]).values();
    }

    values(): URLSearchParamsIterator<string> {
        return state(this).array.map(x => x[1]).values();
    }

    declare [Symbol.iterator]: () => URLSearchParamsIterator<[string, string]>;

    // @ts-ignore
    /** @internal */[SymbolP.iterator]() {
        return this.entries();
    }

    toString(): string {
        let array = state(this).array;
        let result: string[] = [];
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!;
            result.push(encode(item[0]) + "=" + encode(item[1]));
        }
        return result.join("&");
    }

    /** @internal */ get [SymbolP.toStringTag]() { return "URLSearchParams"; }
    /** @internal */ get __MPHTTPX__() { return { chain: ["URLSearchParams"] }; }
}

/** @internal */
class URLSearchParamsState {
    array: [string, string][] = [];
}

function state(target: URLSearchParamsP) {
    return target.__URLSearchParams__;
}

function checkArgsFn(actual: number, expect: number, funcName: string) {
    checkArgsLength(actual, expect, "URLSearchParams", funcName);
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

const URLSearchParamsE = (typeof URLSearchParams !== "undefined" && URLSearchParams) || URLSearchParamsP;
export { URLSearchParamsE as URLSearchParams };
