import { Payload } from "../helpers/Payload";
import { BlobP } from "../file-system/BlobP";
import { FileP } from "../file-system/FileP";
import { FormDataP } from "../network/FormDataP";
import { SymbolP, className, setState, isObjectType } from "../utils";

export class BodyImpl implements Body, MPObject {
    /** @internal */
    constructor() {
        if (new.target === BodyImpl) {
            throw new TypeError("Failed to construct 'Body': Illegal constructor");
        }

        setState(this, "__Body__", new BodyState());
    }

    /** @internal */ declare readonly __Body__: BodyState;

    get bodyUsed() { return state(this).bodyUsed; };
    get body(): ReadableStream<Uint8Array<ArrayBuffer>> | null {
        throw new TypeError(`Failed to access 'body' on '${className(this)}': property not implemented.`);
    }

    arrayBuffer(): Promise<ArrayBuffer> {
        const kind = "arrayBuffer";
        return consumed(this, kind) || read(this, kind) as Promise<ArrayBuffer>;
    }

    blob(): Promise<Blob> {
        const kind = "blob";
        return consumed(this, kind) || read(this, kind) as Promise<Blob>;
    }

    bytes(): Promise<Uint8Array<ArrayBuffer>> {
        const kind = "bytes";
        return consumed(this, kind) || read(this, kind) as Promise<Uint8Array<ArrayBuffer>>;
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
    /** @internal */ get [SymbolP.toStringTag]() { return "Body"; }
    /** @internal */ get __MPHTTPX__() { return { chain: ["Body"] }; }
}

/** @internal */
class BodyState {
    bodyUsed = false;
    payload?: Payload | undefined;
}

function state(target: BodyImpl) {
    return target.__Body__;
}

/** @internal */
export function Body_init(instance: Body, body?: BodyInit | null | undefined) {
    const b = instance as BodyImpl;
    if (isObjectType<ReadableStream>("ReadableStream", body)) {
        throw new TypeError(`Failed to construct '${className(b)}': ReadableStream not implemented.`);
    }

    if (body !== null && body !== undefined) {
        state(b).payload = new Payload(body);
    }
}

function read(body: BodyImpl, kind: "arrayBuffer" | "blob" | "bytes" | "formData" | "json" | "text"): Promise<unknown> {
    let payload = state(body).payload || new Payload();

    if (kind === "json") {
        return payload.text().then(r => JSON.parse(r));
    }

    else if (kind === "text") {
        return payload.text();
    }

    else if (kind === "arrayBuffer") {
        return payload.arrayBuffer();
    }

    else if (kind === "bytes") {
        return payload.arrayBuffer().then(r => new Uint8Array(r));
    }

    else if (kind === "blob") {
        return payload.promise.then(r => new BlobP([r]));
    }

    else if (kind === "formData") {
        return payload.text().then(r => createFormDataFromBinaryText(r, extractBoundary(payload.type)));
    }

    else {
        return payload.promise as Promise<never>;
    }
}

function consumed(body: BodyImpl, kind: string) {
    if (!state(body).payload) return;
    if (!body.bodyUsed) { state(body).bodyUsed = true; return; }
    return Promise.reject(new TypeError(`Failed to execute '${kind}' on '${className(body)}': body stream already read`));
}

function extractBoundary(contentType: string | null) {
    if (!contentType) return;
    if (!/multipart\/form-data/i.test(contentType)) return;

    let boundaryMatch = contentType.match(/boundary\s*=\s*([^;]+)/i);
    if (boundaryMatch && boundaryMatch[1]) {
        let boundary = boundaryMatch[1].trim();
        return boundary.replace(/^["']|["']$/g, "");
    }
}

function createFormDataFromBinaryText(text: string, boundary?: string): FormData {
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
