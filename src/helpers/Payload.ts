import { encode } from "./encode";
import { decode } from "./decode";
import { BlobP } from "../file-system/BlobP";
import { isBlob } from "./isBlob";
import { isPolyfillType } from "../utils";
import { isArrayBuffer } from "./isArrayBuffer";
import { isURLSearchParams } from "./isURLSearchParams";

/** @internal */
export class Payload {
    constructor(body?: XMLHttpRequestBodyInit | null) {
        if (typeof body === "string") {
            this.promise = Promise.resolve(body);
            this.type = "text/plain;charset=UTF-8";
            this.calcLength = () => encode(body).length;
        }

        else if (isURLSearchParams(body)) {
            let _body = body.toString();
            this.promise = Promise.resolve(_body);
            this.type = "application/x-www-form-urlencoded;charset=UTF-8";
            this.calcLength = () => encode(_body).length;
        }

        else if (isArrayBuffer(body)) {
            this.promise = Promise.resolve(body.slice(0));
            this.length = body.byteLength;
        }

        else if (ArrayBuffer.isView(body)) {
            let _body = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength);
            this.promise = Promise.resolve(_body);
            this.length = _body.byteLength;
        }

        else if (isBlob(body)) {
            this.promise = body.arrayBuffer();
            this.type = body.type;
            this.length = body.size;
        }

        else if (isFormData(body)) {
            let _body = FormData_toBlob(body);
            this.promise = _body.arrayBuffer();
            this.type = _body.type;
            this.length = _body.size;
        }

        else if (body === null || body === undefined) {
            this.promise = Promise.resolve("");
            this.length = 0;
        }

        else {
            let _body = "" + body;
            this.promise = Promise.resolve(_body);
            this.type = "text/plain;charset=UTF-8";
            this.calcLength = () => encode(_body).length;
        }
    }

    promise: Promise<string | ArrayBuffer>;
    type = "";

    get size() {
        if (typeof this.length !== "number" && this.calcLength) this.length = this.calcLength();
        return this.length ?? 0;
    }

    private length?: number;
    private calcLength?: () => number;
    text() { return this.promise.then(r => typeof r === "string" ? r : decode(r)); }
    arrayBuffer() { return this.promise.then(r => isArrayBuffer(r) ? r : encode(r).buffer); }
}

function isFormData(value: unknown): value is FormData {
    return isPolyfillType<FormData>("FormData", value) || isExternalFormData(value);
}

function isExternalFormData(value: unknown): value is FormData {
    let expect = "[object FormData]";
    return (Object.prototype.toString.call(value) === expect || String(value) === expect)
        && "forEach" in (value as object)
        && typeof (value as (object & Record<"forEach", unknown>)).forEach === "function";
}

function FormData_toBlob(formData: FormData): Blob {
    const boundary = "----formdata-mphttpx-" + Math.random();
    const p = `--${boundary}\r\nContent-Disposition: form-data; name="`;

    let chunks: BlobPart[] = [];

    formData.forEach((value, name) => {
        typeof value === "string"
            ? chunks.push(p + escape(normalizeLinefeeds(name)) + `"\r\n\r\n${normalizeLinefeeds(value)}\r\n`)
            : chunks.push(p + escape(normalizeLinefeeds(name)) + `"; filename="${escape(value.name)}"\r\nContent-Type: ${value.type || "application/octet-stream"}\r\n\r\n`, value, `\r\n`);
    });

    chunks.push(`--${boundary}--`);
    return new BlobP(chunks, { type: "multipart/form-data; boundary=" + boundary });
}

// normalize line feeds for textarea
// https://html.spec.whatwg.org/multipage/form-elements.html#textarea-line-break-normalisation-transformation
function normalizeLinefeeds(value: string) {
    return value.replace(/\r?\n|\r/g, "\r\n");
}

function escape(str: string) {
    return str.replace(/\n/g, '%0A').replace(/\r/g, '%0D').replace(/"/g, '%22');
}
