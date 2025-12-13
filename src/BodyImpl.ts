import { BlobP, blobState } from "./BlobP";
import { TextEncoderP } from "./TextEncoderP";
import { TextDecoderP } from "./TextDecoderP";
import { type FormDataP, formDataState, createFormDataFromBody } from "./FormDataP";
import { polyfill, isObjectType, isPolyfillType, defineStringTag } from "./isPolyfill";

/** @internal */ const state = Symbol(/* "BodyState" */);
/** @internal */ export { state as bodyState };

export class BodyImpl implements Body {
    constructor() {
        if (new.target === BodyImpl) {
            throw new TypeError("Failed to construct 'Body': Illegal constructor");
        }

        this[state] = new BodyState();
    }

    /** @internal */
    [state]: BodyState;

    get body(): Body["body"] {
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

    bytes() {
        const kind = "bytes";
        return consumed.call(this[state], kind) || read.call(this[state], kind) as Promise<InstanceType<typeof Uint8Array>>;
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

defineStringTag(BodyImpl, "Body");

/** @internal */
export const _name = Symbol();

/** @internal */
export const _body = Symbol();

/** @internal */
class BodyState {
    bodyUsed = false;

    [_name] = "Body";
    [_body]: string | ArrayBuffer = "";
}

/** @internal */
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

type TReadSyncResult = ArrayBuffer | Blob | InstanceType<typeof Uint8Array> | FormData | object | string;

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

const encode = (str: string) => {
    const encoder = new TextEncoderP();
    return encoder.encode(str).buffer;
}

const decode = (buf: ArrayBuffer) => {
    let decoder = new TextDecoderP();
    return decoder.decode(buf);
}

/** @internal */
export function convert(
    body?: Parameters<XMLHttpRequest["send"]>[0],
    setContentType?: (str: string) => void,
    setContentLength?: (num: () => number) => void,
): string | ArrayBuffer {
    let result: string | ArrayBuffer;

    if (typeof body === "string") {
        result = body;

        if (setContentType) {
            setContentType("text/plain;charset=UTF-8");
        }
    }

    else if (isObjectType<URLSearchParams>("URLSearchParams", body)) {
        result = body.toString();

        if (setContentType) {
            setContentType("application/x-www-form-urlencoded;charset=UTF-8");
        }
    }

    else if (body instanceof ArrayBuffer) {
        result = body.slice(0);
    }

    else if (ArrayBuffer.isView(body)) {
        result = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength);
    }

    else if (isPolyfillType<Blob>("Blob", body)) {
        result = (body as BlobP)[blobState].toUint8Array().buffer.slice(0);

        if (setContentType && body.type) {
            setContentType(body.type);
        }
    }

    else if (isPolyfillType<FormData>("FormData", body)) {
        let blob = (body as FormDataP)[formDataState].toBlob();
        result = blob[blobState].toUint8Array().buffer;

        if (setContentType) {
            setContentType(blob.type);
        }
    }

    else if (!body) {
        result = "";
    }

    else {
        result = String(body);
    }

    if (setContentLength) {
        setContentLength(() => (typeof result === "string" ? encode(result) : result).byteLength);
    }

    return result;
}

/** @internal */
export function convertBack(
    type: XMLHttpRequestResponseType,
    data?: string | object | ArrayBuffer,
): string | object | ArrayBuffer | Blob {
    let temp = !!data ? (typeof data !== "string" && !(data instanceof ArrayBuffer) ? JSON.stringify(data) : data) : "";

    if (!type || type === "text") {
        return typeof temp === "string" ? temp : decode(temp);
    }

    else if (type === "json") {
        return JSON.parse(typeof temp === "string" ? temp : decode(temp));
    }

    else if (type === "arraybuffer") {
        return temp instanceof ArrayBuffer ? temp.slice(0) : encode(temp);
    }

    else if (type === "blob") {
        return new BlobP([temp]);
    }

    else {
        return temp;
    }
}
