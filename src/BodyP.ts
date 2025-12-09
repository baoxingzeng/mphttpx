import { createFormDataFromBody } from "./FormDataP";
import type { TUint8ArrayOfArrayBuffer } from "./BlobP";
import { convert, convertBack } from "./XMLHttpRequestP";
import { polyfill, isObjectType, defineStringTag } from "./isPolyfill";

const state = Symbol(/* "BodyState" */);
export { state as bodyState };

export class BodyP implements Body {
    constructor() {
        if (new.target === BodyP) {
            throw new TypeError("Failed to construct 'Body': Illegal constructor");
        }

        this[state] = new BodyState();
    }

    [state]: BodyState;

    get body(): ReadableStream<TUint8ArrayOfArrayBuffer> | null {
        if (!this[state][_body]) { return null; }
        throw new ReferenceError("ReadableStream is not defined");
    }

    get bodyUsed() { return this[state].bodyUsed; };

    arrayBuffer(): Promise<ArrayBuffer> {
        const kind = "arrayBuffer";
        return consumed.call(this[state], kind) || read.call(this[state], kind) as Promise<ArrayBuffer>;
    }

    blob(): Promise<Blob> {
        const kind = "blob";
        return consumed.call(this[state], kind) || read.call(this[state], kind) as Promise<Blob>;
    }

    bytes(): Promise<TUint8ArrayOfArrayBuffer> {
        const kind = "bytes";
        return consumed.call(this[state], kind) || read.call(this[state], kind) as Promise<TUint8ArrayOfArrayBuffer>;
    }

    formData(): Promise<FormData> {
        const kind = "formData";
        return consumed.call(this[state], kind) || read.call(this[state], kind) as Promise<FormData>;
    }

    json(): Promise<any> {
        const kind = "json";
        return consumed.call(this[state], kind) || read.call(this[state], kind);
    }

    text(): Promise<string> {
        const kind = "text";
        return consumed.call(this[state], kind) || read.call(this[state], kind) as Promise<string>;
    }

    toString() { return "[object Body]"; }
    get isPolyfill() { return { symbol: polyfill, hierarchy: ["Body"] }; }
}

defineStringTag(BodyP, "Body");

export const _name = Symbol();
export const _body = Symbol();

class BodyState {
    bodyUsed = false;

    [_name] = "Body";
    [_body]: string | ArrayBuffer = "";
}

export function initFn(this: BodyState, body?: ConstructorParameters<typeof Response>[0], headers?: Headers) {
    if (isObjectType<ReadableStream>("ReadableStream", body)) {
        throw new ReferenceError("ReadableStream is not defined");
    }

    this[_body] = convert(body, type => {
        if (headers && !headers.get("Content-Type")) {
            headers.set("Content-Type", type);
        }
    });
}

function read(this: BodyState, kind: "arrayBuffer" | "blob" | "bytes" | "formData" | "json" | "text") {
    return new Promise((resolve, reject) => {
        try {
            resolve(readSync.call(this, kind));
        } catch (e) {
            reject(e);
        }
    });
}

type TReadSyncResult = ArrayBuffer | Blob | TUint8ArrayOfArrayBuffer | FormData | object | string;

function readSync(this: BodyState, kind: Parameters<typeof read>[0]): TReadSyncResult {
    if (kind === "arrayBuffer") {
        return convertBack("arraybuffer", this[_body]) as ArrayBuffer;
    }

    else if (kind === "blob") {
        return convertBack("blob", this[_body]) as Blob;
    }

    else if (kind === "bytes") {
        let arrayBuffer = convertBack("arraybuffer", this[_body]) as ArrayBuffer;
        return new Uint8Array(arrayBuffer);
    }

    else if (kind === "formData") {
        let text = convertBack("text", this[_body]) as string;
        return createFormDataFromBody(text);
    }

    else if (kind === "json") {
        return convertBack("json", this[_body]) as object;
    }

    else {
        return convertBack("text", this[_body]) as string;
    }
}

function consumed(this: BodyState, kind: string) {
    if (!this[_body]) return;
    if (this.bodyUsed) {
        return Promise.reject(new TypeError(`TypeError: Failed to execute '${kind}' on '${this[_name]}': body stream already read`));
    }
    this.bodyUsed = true;
}
