import { isBlob } from "../helpers/isBlob";
import { isSequence } from "../helpers/isSequence";
import { SymbolP, className, setState } from "../utils";
import { encode } from "../helpers/encode";
import { decode } from "../helpers/decode";
import { isArrayBuffer } from "../helpers/isArrayBuffer";

export class BlobP implements Blob {
    constructor(blobParts: BlobPart[] = [], options?: BlobPropertyBag) {
        if (!isSequence(blobParts)) {
            throw new TypeError(`Failed to construct 'Blob/File': The provided value cannot be converted to a sequence.`);
        }

        let _blobParts = Array.isArray(blobParts) ? blobParts : Array.from<BlobPart>(blobParts);
        let tasks: Promise<Uint8Array<ArrayBuffer>>[] = [];
        let size = 0;

        for (let i = 0; i < _blobParts.length; ++i) {
            let chunk = _blobParts[i]!;
            if (isBlob(chunk)) {
                size += chunk.size;
                tasks.push(chunk.arrayBuffer().then(r => new Uint8Array(r)));
            } else if (isArrayBuffer(chunk) || ArrayBuffer.isView(chunk)) {
                let bytes = BufferSource_toUint8Array(chunk);
                size += bytes.length;
                tasks.push(Promise.resolve(bytes));
            } else {
                let bytes = encode("" + chunk);
                size += bytes.length;
                tasks.push(Promise.resolve(bytes));
            }
        }

        setState(this, "__Blob__", new BlobState(Promise.all(tasks).then(chunks => concat(chunks))));
        state(this).size = size;
        state(this).type = normalizeType(options?.type);
    }

    /** @internal */ declare readonly __Blob__: BlobState;

    get size() { return state(this).size; }
    get type() { return state(this).type; }

    arrayBuffer(): Promise<ArrayBuffer> {
        return state(this).promise.then(r => clone(r.buffer).buffer);
    }

    bytes(): Promise<Uint8Array<ArrayBuffer>> {
        return state(this).promise.then(r => clone(r.buffer));
    }

    slice(start?: number, end?: number, contentType?: string): Blob {
        let _start = start ?? 0, _end = end ?? this.size;
        let blob = Object.create(BlobP.prototype) as BlobP;
        setState(blob, "__Blob__", new BlobState(state(this).promise.then(r => clone(r.slice(_start, _end)))));
        state(blob).size = calcSlicedSize(this.size, _start, _end);
        state(blob).type = normalizeType(contentType);
        return blob;
    }

    stream(): ReadableStream<Uint8Array<ArrayBuffer>> {
        throw new TypeError(`Failed to execute 'stream' on '${className(this)}': method not implemented.`);
    }

    text(): Promise<string> {
        return state(this).promise.then(r => decode(r));
    }

    /** @internal */ toString() { return "[object Blob]"; }
    /** @internal */ get [SymbolP.toStringTag]() { return "Blob"; }
    /** @internal */ get __MPHTTPX__() { return { chain: ["Blob"] }; }
}

class BlobState {
    constructor(promise: Promise<Uint8Array<ArrayBuffer>>) {
        this.promise = promise;
    }
    promise: Promise<Uint8Array<ArrayBuffer>>;
    size = 0;
    type = "";
}

function state(target: BlobP) {
    return target.__Blob__;
}

function BufferSource_toUint8Array(buf: BufferSource): Uint8Array<ArrayBuffer> {
    return isArrayBuffer(buf)
        ? new Uint8Array(buf)
        : new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

function normalizeType(type?: string) {
    let rawType = "" + (type !== undefined ? type : "");
    return /[^\u0020-\u007E]/.test(rawType) ? "" : rawType.toLowerCase();
}

function clone(buf: BufferSource) {
    let sourceArray = BufferSource_toUint8Array(buf);
    let cloneArray = new Uint8Array(new ArrayBuffer(sourceArray.byteLength));

    cloneArray.set(sourceArray);
    return cloneArray;
}

function concat(chunks: Uint8Array<ArrayBuffer>[]) {
    let totalByteLength = chunks.reduce((acc, cur) => acc + cur.byteLength, 0);
    let result = new Uint8Array(totalByteLength);

    chunks.reduce((offset, chunk) => {
        result.set(chunk, offset);
        return offset + chunk.byteLength;
    }, 0);

    return result;
}

function calcSlicedSize(originalSize: number, start?: number, end?: number) {
    const normalizeNumer = (n?: number) => {
        let num = Number(n); if (isNaN(num)) num = 0;
        if (num >= 0) {
            num = Math.min(num, originalSize);
        } else {
            num = Math.max(0, num + originalSize);
        }
        return num;
    }
    return Math.max(0, normalizeNumer(end) - normalizeNumer(start));
}

const BlobE = (typeof Blob !== "undefined" && Blob) || BlobP;
export { BlobE as Blob };
