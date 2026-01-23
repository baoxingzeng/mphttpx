import { BlobP, Blob_toUint8Array, encode, decode } from "./BlobP";
import { FormData_toBlob } from "./FormDataP";
import { isObjectType, isPolyfillType, isArrayBuffer } from "./isPolyfill";

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
        if (setContentType) { setContentType("text/plain;charset=UTF-8"); }
    }

    else if (isObjectType<URLSearchParams>("URLSearchParams", body) || isPolyfillType<URLSearchParams>("URLSearchParams", body)) {
        result = body.toString();
        if (setContentType) { setContentType("application/x-www-form-urlencoded;charset=UTF-8"); }
    }

    else if (isArrayBuffer(body)) {
        result = cloneArrayBuffer ? body.slice(0) : body;
    }

    else if (ArrayBuffer.isView(body)) {
        result = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength);
    }

    else if (isPolyfillType<Blob>("Blob", body)) {
        result = Blob_toUint8Array(body).buffer.slice(0);
        if (setContentType && body.type) { setContentType(body.type); }
    }

    else if (isPolyfillType<FormData>("FormData", body)) {
        let blob = FormData_toBlob(body);
        result = Blob_toUint8Array(blob).buffer;
        if (setContentType) { setContentType(blob.type); }
    }

    else if (!body) {
        result = "";
    }

    else {
        result = "" + body;
    }

    if (setContentLength) {
        let calculated = false, contentLength = 0;
        setContentLength(() => {
            if (!calculated) {
                calculated = true; contentLength = (typeof result === "string" ? encode(result).buffer : result).byteLength;
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
    let temp = !!data ? (typeof data !== "string" && !isArrayBuffer(data) ? JSON.stringify(data) : data) : "";

    if (!type || type === "text") {
        return typeof temp === "string" ? temp : decode(temp);
    }

    else if (type === "json") {
        return JSON.parse(typeof temp === "string" ? temp : decode(temp));
    }

    else if (type === "arraybuffer") {
        return isArrayBuffer(temp) ? temp.slice(0) : encode(temp).buffer;
    }

    else if (type === "blob") {
        return new BlobP([temp]);
    }

    else {
        return temp;
    }
}
