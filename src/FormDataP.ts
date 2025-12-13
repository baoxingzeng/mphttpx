import { BlobP } from "./BlobP";
import { FileP } from "./FileP";
import { TextEncoderP } from "./TextEncoderP";
import { g, polyfill, isPolyfillType, defineStringTag } from "./isPolyfill";

/** @internal */ const state = Symbol(/* "FormDataState" */);
/** @internal */ export { state as formDataState };

export class FormDataP implements FormData {
    constructor(form?: HTMLFormElement, submitter?: HTMLElement | null) {
        if (form !== void 0) {
            throw new TypeError("Failed to construct 'FormData': parameter 1 is not of type	'HTMLFormElement'.");
        }

        if (!!submitter) {
            throw new TypeError("Failed to construct 'FormData': parameter 2 is not of type 'HTMLElement'.");
        }

        this[state] = new FormDataState();
    }

    /** @internal */
    [state]: FormDataState;

    append(name: string, value: string | Blob, filename?: string) {
        this[state][_formData].push(normalizeArgs(name, value, filename));
    }

    delete(name: string) {
        let result: [string, FormDataEntryValue][] = [];
        name = String(name);

        each(this[state][_formData], entry => {
            entry[0] !== name && result.push(entry);
        });

        this[state][_formData] = result;
    }

    get(name: string): FormDataEntryValue | null {
        let entries = this[state][_formData];
        name = String(name);

        for (let i = 0; i < entries.length; ++i) {
            if (entries[i]![0] === name) {
                return entries[i]![1];
            }
        }

        return null;
    }

    getAll(name: string): FormDataEntryValue[] {
        let result: FormDataEntryValue[] = [];
        name = String(name);

        each(this[state][_formData], data => {
            data[0] === name && result.push(data[1]);
        });

        return result;
    }

    has(name: string): boolean {
        name = String(name);

        for (let i = 0; i < this[state][_formData].length; ++i) {
            if (this[state][_formData][i]![0] === name) {
                return true;
            }
        }

        return false;
    }

    set(name: string, value: string | Blob, filename?: string) {
        name = String(name);
        let result: [string, FormDataEntryValue][] = [];
        let args = normalizeArgs(name, value, filename);
        let replace = true;

        each(this[state][_formData], data => {
            data[0] === name
                ? replace && (replace = !result.push(args))
                : result.push(data);
        })

        replace && result.push(args);

        this[state][_formData] = result;
    }

    forEach(callbackfn: (value: FormDataEntryValue, key: string, parent: FormData) => void, thisArg?: any): void {
        for (let [name, value] of this) {
            callbackfn.call(thisArg, value, name, thisArg);
        }
    }

    entries() {
        return this[state][_formData].values();
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

    toString() { return "[object FormData]"; }
    get isPolyfill() { return { symbol: polyfill, hierarchy: ["FormData"] }; }
}

defineStringTag(FormDataP, "FormData");

/** @internal */
const _formData = Symbol();

/** @internal */
class FormDataState {
    [_formData]: [string, FormDataEntryValue][] = [];

    toBlob() {
        const boundary = "----formdata-polyfill-" + Math.random();
        const p = `--${boundary}\r\nContent-Disposition: form-data; name="`;

        let chunks: BlobPart[] = [];

        for (const [name, value] of this[_formData].values()) {
            if (typeof value === "string") {
                chunks.push(p + escape(normalizeLinefeeds(name)) + `"\r\n\r\n${normalizeLinefeeds(value)}\r\n`);
            } else {
                chunks.push(p + escape(normalizeLinefeeds(name)) + `"; filename="${escape(value.name)}"\r\nContent-Type: ${value.type || "application/octet-stream"}\r\n\r\n`, value, `\r\n`);
            }
        }

        chunks.push(`--${boundary}--`);

        return new BlobP(chunks, {
            type: "multipart/form-data; boundary=" + boundary,
        });
    }
}

function normalizeArgs(name: string, value: string | Blob, filename?: string): [string, FormDataEntryValue] {
    if (isPolyfillType<Blob>("Blob", value)) {
        filename = filename !== undefined
            ? String(filename + "")
            : typeof (value as File).name === "string"
                ? (value as File).name
                : "blob";

        if ((value as File).name !== filename || Object.prototype.toString.call(value) === "[object Blob]") {
            value = new FileP([value], filename);
        }

        return [String(name), value as File];
    }

    return [String(name), String(value)];
}

function normalizeLinefeeds(value: string) {
    return value.replace(/\r?\n|\r/g, "\r\n");
}

function each<T>(arr: ArrayLike<T>, cb: (elm: T) => void) {
    for (let i = 0; i < arr.length; ++i) {
        cb(arr[i]!);
    }
}

function escape(str: string) {
    return str.replace(/\n/g, '%0A').replace(/\r/g, '%0D').replace(/"/g, '%22');
}

/**
 * Parses multipart/form-data binary data, supporting restoration of text fields and files
 * @param body - Text in multipart/form-data format (including boundaries and data)
 * @returns Parsed FormData object (text fields as strings, files as File objects)
 * @internal
 */
export function createFormDataFromBody(body: string, errMsg = "Failed to fetch") {
    const formData = new FormDataP();
    if (typeof body !== "string" || body.trim() === "") {
        return formData;
    }

    // 1. Extract boundary string (from the first line, removing leading "--")
    const firstLineEnd = body.indexOf("\r\n");
    if (firstLineEnd === -1) {
        // Invalid multipart format: Missing line break in header
        throw new TypeError(errMsg);
    }
    const boundary = body.substring(2, firstLineEnd).trim();
    if (!boundary) {
        // Invalid multipart format: Empty boundary
        throw new TypeError("Invalid MIME type");
    }

    // 2. Split data into individual parts (excluding empty content and trailing "--")
    const parts = body.split(`--${boundary}`).filter(part => {
        const trimmed = part.trim();
        return trimmed !== "" && trimmed !== "--";
    });

    if (parts.length === 0) {
        // Invalid multipart format: No parts found
        throw new TypeError(errMsg);
    }

    // 3. Parse each part
    parts.forEach(part => {
        // Split header and content (separator between header and content is "\r\n\r\n")
        const separatorIndex = part.indexOf("\r\n\r\n");
        if (separatorIndex === -1) {
            // Invalid part format: Missing header-content separator
            throw new TypeError(errMsg);
        }

        // Extract header (Content-Disposition and Content-Type)
        const headerRaw = part.substring(0, separatorIndex).trim();
        const contentRaw = part.substring(separatorIndex + 4); // Skip "\r\n\r\n"

        // Parse header information
        const nameMatch = headerRaw.match(/name="([^"]+)"/); // Field name
        const filenameMatch = headerRaw.match(/filename="([^"]*)"/); // Filename (optional, only for file fields)
        const contentTypeMatch = headerRaw.match(/Content-Type: ([^\r\n]+)/); // MIME type (optional)

        if (!nameMatch || !nameMatch[1]) {
            // Invalid part format: Missing field name
            throw new TypeError(errMsg);
        }
        const fieldName = nameMatch[1];
        const isFile = !!filenameMatch; // Whether it's a file field
        const mimeType = contentTypeMatch ? (contentTypeMatch[1] || "").trim() : "application/octet-stream";

        // 4. Process content (text or binary)
        if (isFile) {
            // File field: Use TextEncoder to handle raw binary data
            try {
                // Remove line breaks from content (simulating browser behavior)
                const content = contentRaw.replace(/\r\n/g, "");
                // Convert string to Uint8Array using TextEncoder
                const encoder = new TextEncoderP();
                const uint8Array = encoder.encode(content);
                // Create File object (default filename is unknown-file)
                const filename = filenameMatch[1] || "unknown-file";
                const file = new FileP([uint8Array], filename, { type: mimeType });
                formData.append(fieldName, file, filename);
            } catch (e) {
                // `Failed to process file field "${fieldName}": ${(e as Error).message}`
                throw new TypeError(errMsg);
            }
        } else {
            // Text field: Directly take content (remove leading/trailing line breaks to match browser behavior)
            const value = contentRaw.replace(/^[\r\n]+|[\r\n]+$/g, "");
            formData.append(fieldName, value);
        }
    });

    return formData;
}

const FormDataE = g["FormData"] || FormDataP;
export { FormDataE as FormData };
