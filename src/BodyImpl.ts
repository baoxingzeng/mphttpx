import { polyfill, isObjectType } from "./isPolyfill";
import { convert, convertBack } from "./convertor";
import { createFormDataFromBinaryText } from "./FormDataP";

/** @internal */ const state = Symbol(/* "BodyState" */);
/** @internal */ export { state as bodyState };

export abstract class BodyImpl implements Body {
    /** @internal */
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
    /** @internal */ abstract get headers(): Headers;

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
    /** @internal */ get [Symbol.toStringTag]() { return "Body"; }
    /** @internal */ get isPolyfill() { return { symbol: polyfill, hierarchy: ["Body"] }; }
}

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
        throw new TypeError(`Failed to construct '${b[state].name}': ReadableStream not implemented.`);
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
        return Promise.reject(new TypeError(`Failed to execute '${kind}' on '${s.name}': body stream already read`));
    }
    s.bodyUsed = true;
}
