import { BlobP, Blob_toUint8Array, encode, decode } from "./BlobP";
import { FormData_toBlob, createFormDataFromBinaryText } from "./FormDataP";
import { polyfill, Class_setStringTag, isObjectType, isPolyfillType } from "./isPolyfill";

/** @internal */ const state = Symbol(/* "BodyState" */);
/** @internal */ export { state as bodyState };

export abstract class BodyImpl implements Body {
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
        throw new TypeError(`Failed to access 'body' on '${this[state].name}': property not implemented.`);
    }

    get bodyUsed() { return this[state].bodyUsed; };

    /** @internal */
    abstract get headers(): Headers;

    arrayBuffer(): Promise<ArrayBuffer> {
        const kind = "arrayBuffer";
        return consumed(this, kind) || read(this, kind) as Promise<ArrayBuffer>;
    }

    blob(): Promise<Blob> {
        const kind = "blob";
        return consumed(this, kind) || read(this, kind) as Promise<Blob>;
    }

    bytes() {
        const kind = "bytes";
        return consumed(this, kind) || read(this, kind) as Promise<InstanceType<typeof Uint8Array>>;
    }

    formData(): Promise<FormData> {
        const kind = "formData";
        return consumed(this, kind) || read(this, kind) as Promise<FormData>;
    }

    json(): Promise<any> {
        const kind = "json";
        return consumed(this, kind) || read(this, kind);
    }

    text(): Promise<string> {
        const kind = "text";
        return consumed(this, kind) || read(this, kind) as Promise<string>;
    }

    /** @internal */ toString() { return "[object Body]"; }
    /** @internal */ get isPolyfill() { return { symbol: polyfill, hierarchy: ["Body"] }; }
}

Class_setStringTag(BodyImpl, "Body");

/** @internal */
const _body = Symbol();

/** @internal */
class BodyState {
    name = "Body";
    bodyUsed = false;
    [_body]: string | ArrayBuffer = "";
}

/** @internal */
export function Body_init(body: Body, payload?: ConstructorParameters<typeof Response>[0]) {
    const b = body as BodyImpl;
    if (isObjectType<ReadableStream>("ReadableStream", payload)) {
        throw new TypeError(`${b[state].name} constructor: ReadableStream is not implemented.`);
    }
    b[state][_body] = convert(payload, true, type => { if (!b.headers.has("Content-Type")) { b.headers.set("Content-Type", type); } });
}

/** @internal */
export function Body_toPayload(body: Body) {
    return (body as BodyImpl)[state][_body];
}

function read(body: Body, kind: "arrayBuffer" | "blob" | "bytes" | "formData" | "json" | "text") {
    return new Promise((resolve, reject) => {
        try { resolve(readSync(body, kind)); }
        catch (e) { reject(e); }
    });
}

function readSync(
    body: Body,
    kind: Parameters<typeof read>[1],
): ArrayBuffer | Blob | InstanceType<typeof Uint8Array> | FormData | object | string {
    const payload = (body as BodyImpl)[state][_body];

    if (kind === "arrayBuffer") {
        return convertBack("arraybuffer", payload) as ArrayBuffer;
    }

    else if (kind === "blob") {
        return convertBack("blob", payload) as Blob;
    }

    else if (kind === "bytes") {
        let arrayBuffer = convertBack("arraybuffer", payload) as ArrayBuffer;
        return new Uint8Array(arrayBuffer);
    }

    else if (kind === "formData") {
        const extractBoundary = (contentType: string | null) => {
            if (!contentType) { return; }
            if (!/multipart\/form-data/i.test(contentType)) { return; }

            let boundaryMatch = contentType.match(/boundary\s*=\s*([^;]+)/i);
            if (boundaryMatch && boundaryMatch[1]) {
                let boundary = boundaryMatch[1].trim();
                return boundary.replace(/^["']|["']$/g, "");
            }
        }

        let text = convertBack("text", payload) as string;
        let boundary = extractBoundary((body as BodyImpl).headers.get("Content-Type")) || "";
        return createFormDataFromBinaryText(text, boundary);
    }

    else if (kind === "json") {
        return convertBack("json", payload) as any;
    }

    else {
        return convertBack("text", payload) as string;
    }
}

function consumed(body: Body, kind: string) {
    const s = (body as BodyImpl)[state];
    if (!s[_body]) return;
    if (s.bodyUsed) {
        return Promise.reject(new TypeError(`TypeError: Failed to execute '${kind}' on '${s.name}': body stream already read`));
    }
    s.bodyUsed = true;
}

/** @internal */
export function convert(
    body?: Parameters<XMLHttpRequest["send"]>[0],
    cloneArrayBuffer = true,
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
        result = cloneArrayBuffer ? body.slice(0) : body;
    }

    else if (ArrayBuffer.isView(body)) {
        result = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength);
    }

    else if (isPolyfillType<Blob>("Blob", body)) {
        result = Blob_toUint8Array(body).buffer.slice(0);

        if (setContentType && body.type) {
            setContentType(body.type);
        }
    }

    else if (isPolyfillType<FormData>("FormData", body)) {
        let blob = FormData_toBlob(body);
        result = Blob_toUint8Array(blob).buffer;

        if (setContentType) {
            setContentType(blob.type);
        }
    }

    else if (!body) {
        result = "";
    }

    else {
        result = "" + body;
    }

    if (setContentLength) {
        let calculated = false;
        let contentLength = 0;
        setContentLength(() => {
            if (!calculated) {
                calculated = true;
                contentLength = (typeof result === "string" ? encode(result).buffer : result).byteLength;
            }
            return contentLength;
        });
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
        return temp instanceof ArrayBuffer ? temp.slice(0) : encode(temp).buffer;
    }

    else if (type === "blob") {
        return new BlobP([temp]);
    }

    else {
        return temp;
    }
}
