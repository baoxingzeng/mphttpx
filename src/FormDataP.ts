import { BlobP } from "./BlobP";
import { FileP } from "./FileP";
import { g, polyfill, Class_setStringTag, checkArgsLength, isObjectType, isPolyfillType } from "./isPolyfill";

/** @internal */ const state = Symbol(/* "FormDataState" */);
const checkArgsFn = (args: any[], required: number, funcName: string) => { checkArgsLength(args, required, "FormData", funcName); }

export class FormDataP implements FormData {
    constructor(form?: HTMLFormElement, submitter?: HTMLElement | null) {
        if (submitter === undefined) {
            if (form !== undefined) {
                console.error("TypeError: Failed to construct 'FormData': parameter 1 not implemented.")
            }
        } else {
            if (submitter !== null) {
                console.error("TypeError: Failed to construct 'FormData': parameter 1 and parameter 2 not implemented.");
            }
        }

        this[state] = new FormDataState();
    }

    /** @internal */
    [state]: FormDataState;

    append(...args: [string, string | Blob, string?]) {
        const [name, value, filename] = args;
        checkArgsFn(args, 2, "append");
        this[state][_formData].push(normalizeArgs(name, value, filename));
    }

    delete(...args: [string]) {
        const [name] = args;
        checkArgsFn(args, 1, "delete");
        let _name = "" + name;
        let index = -1;
        let array = this[state][_formData];
        let result: [string, FormDataEntryValue][] = [];
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!;
            if (item[0] === _name) { index = i; continue; }
            result.push(item);
        }
        if (index > -1) { this[state][_formData] = result; }
    }

    get(...args: [string]): FormDataEntryValue | null {
        const [name] = args;
        checkArgsFn(args, 1, "get");
        let _name = "" + name;
        let array = this[state][_formData];
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!;
            if (item[0] === _name) { return item[1]; }
        }
        return null;
    }

    getAll(...args: [string]): FormDataEntryValue[] {
        const [name] = args;
        checkArgsFn(args, 1, "getAll");
        let _name = "" + name;
        let array = this[state][_formData];
        let result: FormDataEntryValue[] = [];
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!;
            if (item[0] === _name) { result.push(item[1]); }
        }
        return result;
    }

    has(...args: [string]): boolean {
        const [name] = args;
        checkArgsFn(args, 1, "has");
        let _name = "" + name;
        let array = this[state][_formData];
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!;
            if (item[0] === _name) { return true; }
        }
        return false;
    }

    set(...args: [string, string | Blob, string?]) {
        const [name, value, filename] = args;
        checkArgsFn(args, 2, "set");
        let _name = "" + name;
        let _args = normalizeArgs(name, value, filename);
        let index = -1;
        let array = this[state][_formData];
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
        this[state][_formData] = result;
    }

    forEach(...args: [(value: FormDataEntryValue, key: string, parent: FormData) => void, any?]): void {
        const [callbackfn, thisArg] = args;
        checkArgsFn(args, 1, "forEach");
        if (typeof callbackfn !== "function") {
            throw new TypeError("Failed to execute 'forEach' on 'FormData': parameter 1 is not of type 'Function'.");
        }
        let array = this[state][_formData];
        for (let i = 0; i < array.length; ++i) {
            let item = array[i]!;
            callbackfn.call(thisArg, item[1], item[0], thisArg);
        }
    }

    entries() {
        return this[state][_formData].map(x => [x[0], x[1]] as [string, FormDataEntryValue]).values();
    }

    keys() {
        return this[state][_formData].map(x => x[0]).values();
    }

    values() {
        return this[state][_formData].map(x => x[1]).values();
    }

    [Symbol.iterator]() {
        return this.entries();
    }

    /** @internal */ toString() { return "[object FormData]"; }
    /** @internal */ get isPolyfill() { return { symbol: polyfill, hierarchy: ["FormData"] }; }
}

Class_setStringTag(FormDataP, "FormData");

/** @internal */
const _formData = Symbol();

/** @internal */
class FormDataState {
    [_formData]: [string, FormDataEntryValue][] = [];
}

/** @internal */
export function FormData_toBlob(formData: FormData): Blob {
    const boundary = "----formdata-mphttpx-" + Math.random();
    const p = `--${boundary}\r\nContent-Disposition: form-data; name="`;

    let chunks: BlobPart[] = [];

    for (let i = 0; i < (formData as FormDataP)[state][_formData].length; ++i) {
        let pair = (formData as FormDataP)[state][_formData][i]!;
        let name = pair[0];
        let value = pair[1];
        if (typeof value === "string") {
            chunks.push(p + escape(normalizeLinefeeds(name)) + `"\r\n\r\n${normalizeLinefeeds(value)}\r\n`);
        } else {
            chunks.push(p + escape(normalizeLinefeeds(name)) + `"; filename="${escape(value.name)}"\r\nContent-Type: ${value.type || "application/octet-stream"}\r\n\r\n`, value, `\r\n`);
        }
    }

    chunks.push(`--${boundary}--`);
    return new BlobP(chunks, { type: "multipart/form-data; boundary=" + boundary });
}

function normalizeArgs(name: string, value: string | Blob, filename?: string): [string, FormDataEntryValue] {
    if (isPolyfillType<Blob>("Blob", value)) {
        filename = filename !== undefined
            ? ("" + filename)
            : typeof (value as File).name === "string"
                ? (value as File).name
                : "blob";
        if ((value as File).name !== filename || isObjectType<Blob>("Blob", value)) {
            value = new FileP([value], filename);
        }
        return ["" + name, value as File];
    }
    return ["" + name, "" + value];
}

// normalize line feeds for textarea
// https://html.spec.whatwg.org/multipage/form-elements.html#textarea-line-break-normalisation-transformation
function normalizeLinefeeds(value: string) {
    return value.replace(/\r?\n|\r/g, "\r\n");
}

function escape(str: string) {
    return str.replace(/\n/g, '%0A').replace(/\r/g, '%0D').replace(/"/g, '%22');
}

/** @internal */
export function createFormDataFromBinaryText(text: string, boundary?: string): FormData {
    const throwParseError = () => {
        throw new TypeError("Could not parse content as FormData.");
    }

    if (typeof text !== "string" || text.trim() === "") {
        throwParseError();
    }

    let firstLineEnd = text.indexOf("\r\n");
    if (firstLineEnd === -1) { throwParseError(); }

    let _boundary = text.substring(2, firstLineEnd).trim();
    if (!_boundary) { throwParseError(); }

    if (boundary !== undefined && boundary !== _boundary) {
        throwParseError();
    }

    let parts = text.split(`--${_boundary}`).filter(part => {
        let trimmed = part.trim();
        return trimmed !== "" && trimmed !== "--";
    });

    if (parts.length === 0) {
        throwParseError();
    }

    let formData = new FormDataP();

    parts.forEach(part => {
        let separatorIndex = part.indexOf("\r\n\r\n");
        if (separatorIndex === -1) { throwParseError(); }

        let headerRaw = part.substring(0, separatorIndex).trim();

        let nameMatch = headerRaw.match(/name="([^"]*)"/);
        if (!nameMatch || nameMatch.length < 2) { throwParseError(); }

        let fieldName = nameMatch![1]!;
        let filenameMatch = headerRaw.match(/filename="([^"]*)"/);
        let contentRaw = part.substring(separatorIndex + 4);

        if (!filenameMatch) {
            formData.append(fieldName, contentRaw.replace(/^[\r\n]+|[\r\n]+$/g, ""));
        } else {
            let filename = filenameMatch[1] || "";
            let contentTypeMatch = headerRaw.match(/Content-Type: ([^\r\n]+)/);
            let mimeType = contentTypeMatch ? (contentTypeMatch[1] || "").trim() : "text/plain";
            let content = contentRaw.replace(/\r\n/g, "");
            formData.append(fieldName, new FileP([content], filename, { type: mimeType }));
        }
    });

    return formData;
}

const FormDataE = g["FormData"] || FormDataP;
export { FormDataE as FormData };
