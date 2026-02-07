import { isBlob } from "../helpers/isBlob";
import { FileP } from "../file-system/FileP";
import { SymbolP, setState, checkArgsLength } from "../utils";

export class FormDataP implements FormData {
    constructor(form?: HTMLFormElement, submitter?: HTMLElement | null) {
        if (submitter === undefined) {
            if (form !== undefined) {
                throw new TypeError("Failed to construct 'FormData': parameter 1 not implemented.");
            }
        } else {
            if (submitter !== null) {
                throw new TypeError("Failed to construct 'FormData': parameter 1 and parameter 2 not implemented.");
            }
        }

        setState(this, "__FormData__", new FormDataState());
    }

    /** @internal */ declare readonly __FormData__: FormDataState;

    append(name: string, blobValue: string | Blob, filename?: string): void {
        checkArgsFn(arguments.length, 2, "append");
        state(this).array.push(normalizeArgs(name, blobValue, filename));
    }

    delete(name: string): void {
        checkArgsFn(arguments.length, 1, "delete");
        let _name = "" + name;
        let index = -1;
        let array = state(this).array;
        let result: [string, FormDataEntryValue][] = [];
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!;
            if (item[0] === _name) { index = i; continue; }
            result.push(item);
        }
        if (index > -1) { state(this).array = result; }
    }

    get(name: string): FormDataEntryValue | null {
        checkArgsFn(arguments.length, 1, "get");
        let _name = "" + name;
        let array = state(this).array;
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!;
            if (item[0] === _name) { return item[1]; }
        }
        return null;
    }

    getAll(name: string): FormDataEntryValue[] {
        checkArgsFn(arguments.length, 1, "getAll");
        let _name = "" + name;
        let array = state(this).array;
        let result: FormDataEntryValue[] = [];
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!;
            if (item[0] === _name) { result.push(item[1]); }
        }
        return result;
    }

    has(name: string): boolean {
        checkArgsFn(arguments.length, 1, "has");
        let _name = "" + name;
        let array = state(this).array;
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!;
            if (item[0] === _name) { return true; }
        }
        return false;
    }

    set(name: string, blobValue: string | Blob, filename?: string): void {
        checkArgsFn(arguments.length, 2, "set");
        let _name = "" + name;
        let _args = normalizeArgs(name, blobValue, filename);
        let index = -1;
        let array = state(this).array;
        let result: [string, FormDataEntryValue][] = [];
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!;
            if (item[0] === _name) {
                if (index === -1) {
                    index = i;
                    result.push(_args);
                }
                continue;
            }
            result.push(item);
        }
        if (index === -1) {
            result.push(_args);
        }
        state(this).array = result;
    }

    forEach(callbackfn: (value: FormDataEntryValue, key: string, parent: FormData) => void, thisArg?: any): void {
        checkArgsFn(arguments.length, 1, "forEach");
        if (typeof callbackfn !== "function") {
            throw new TypeError("Failed to execute 'forEach' on 'FormData': parameter 1 is not of type 'Function'.");
        }
        let array = state(this).array;
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!;
            callbackfn.call(thisArg, item[1], item[0], thisArg);
        }
    }

    entries(): FormDataIterator<[string, FormDataEntryValue]> {
        return state(this).array.map(x => [x[0], x[1]] as [string, FormDataEntryValue]).values();
    }

    keys(): FormDataIterator<string> {
        return state(this).array.map(x => x[0]).values();
    }

    values(): FormDataIterator<FormDataEntryValue> {
        return state(this).array.map(x => x[1]).values();
    }

    declare [Symbol.iterator]: () => FormDataIterator<[string, FormDataEntryValue]>;

    // @ts-ignore
    /** @internal */[SymbolP.iterator](): FormDataIterator<[string, FormDataEntryValue]> {
        return this.entries();
    }

    /** @internal */ toString() { return "[object FormData]"; }
    /** @internal */ get [SymbolP.toStringTag]() { return "FormData"; }
    /** @internal */ get __MPHTTPX__() { return { chain: ["FormData"] }; }
}

/** @internal */
class FormDataState {
    array: [string, FormDataEntryValue][] = [];
}

function state(target: FormDataP) {
    return target.__FormData__;
}

function checkArgsFn(actual: number, expect: number, funcName: string) {
    return checkArgsLength(actual, expect, "FormData", funcName);
}

function normalizeArgs(name: string, value: string | Blob, filename?: string): [string, FormDataEntryValue] {
    if (isBlob(value)) {
        filename = filename !== undefined
            ? ("" + filename)
            : typeof (value as File).name === "string"
                ? (value as File).name
                : "blob";
        if ((value as File).name !== filename || isBlob(value, true)) {
            value = new FileP([value], filename);
        }
        return ["" + name, value as File];
    }
    return ["" + name, "" + value];
}

const FormDataE = (typeof FormData !== "undefined" && FormData) || FormDataP;
export { FormDataE as FormData };
