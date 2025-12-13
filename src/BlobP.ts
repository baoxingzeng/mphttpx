import { TextEncoderP } from "./TextEncoderP";
import { TextDecoderP } from "./TextDecoderP";
import { g, polyfill, isPolyfillType, dfStringTag } from "./isPolyfill";

/** @internal */
const state = Symbol(/* "BlobState" */);

export class BlobP implements Blob {
    constructor(blobParts: BlobPart[] = [], options?: BlobPropertyBag) {
        if (!Array.isArray(blobParts)) {
            throw new TypeError("First argument to Blob constructor must be an Array.");
        }

        let encoder: TextEncoderP | null = null;
        let chunks = blobParts.reduce((chunks: Array<InstanceType<typeof Uint8Array>>, part) => {
            if (isPolyfillType<Blob>("Blob", part)) {
                chunks.push((part as BlobP)[state][_buffer]);
            } else if (part instanceof ArrayBuffer || ArrayBuffer.isView(part)) {
                chunks.push(BufferSource_toUint8Array(part));
            } else {
                if (!encoder) { encoder = new TextEncoderP(); }
                chunks.push(encoder.encode(String(part)));
            }

            return chunks;
        }, []);

        this[state] = new BlobState(concat(chunks));
        const that = this[state];

        that.size = that[_buffer].length;

        let rawType = options?.type || "";
        that.type = /[^\u0020-\u007E]/.test(rawType) ? "" : rawType.toLowerCase();
    }

    /** @internal */
    [state]: BlobState;

    get size() { return this[state].size; }
    get type() { return this[state].type; }

    arrayBuffer(): Promise<ArrayBuffer> {
        return Promise.resolve(clone(this[state][_buffer].buffer).buffer);
    }

    bytes() {
        return Promise.resolve(clone(this[state][_buffer].buffer));
    }

    slice(start?: number, end?: number, contentType?: string): Blob {
        let sliced = this[state][_buffer].slice(start ?? 0, end ?? this[state][_buffer].length);
        return new BlobP([sliced], { type: contentType ?? "" });
    }

    stream(): ReturnType<Blob["stream"]> {
        throw new ReferenceError("ReadableStream is not defined");
    }

    text(): Promise<string> {
        let decoder = new TextDecoderP();
        return Promise.resolve(decoder.decode(this[state][_buffer]));
    }

    toString() { return "[object Blob]"; }
    get isPolyfill() { return { symbol: polyfill, hierarchy: ["Blob"] }; }
}

dfStringTag(BlobP, "Blob");

/** @internal */
const _buffer = Symbol();

/** @internal */
class BlobState {
    constructor(buffer: InstanceType<typeof Uint8Array>) {
        this[_buffer] = buffer;
    }

    [_buffer]: InstanceType<typeof Uint8Array>;
    size = 0;
    type = "";
}

/** @internal */
export function Blob_toUint8Array(blob: Blob) {
    return (blob as BlobP)[state][_buffer];
}

function BufferSource_toUint8Array(buf: BufferSource): InstanceType<typeof Uint8Array> {
    return buf instanceof ArrayBuffer
        ? new Uint8Array(buf)
        : new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

function clone(buf: BufferSource) {
    let sourceArray = BufferSource_toUint8Array(buf);
    let cloneArray = new Uint8Array(new ArrayBuffer(sourceArray.byteLength));

    cloneArray.set(sourceArray);
    return cloneArray;
}

function concat(chunks: Uint8Array[]) {
    let totalByteLength = chunks.reduce((acc, cur) => acc + cur.byteLength, 0);
    let result = new Uint8Array(totalByteLength);

    chunks.reduce((offset, chunk) => {
        result.set(chunk, offset);
        return offset + chunk.byteLength;
    }, 0);

    return result;
}

/** @internal */
export function Uint8Array_toBase64(input: InstanceType<typeof Uint8Array>) {
    let byteToCharMap = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let output: string[] = [];

    for (var i = 0; i < input.length; i += 3) {
        let byte1 = input[i]!;
        let haveByte2 = i + 1 < input.length;
        let byte2 = haveByte2 ? input[i + 1]! : 0;
        let haveByte3 = i + 2 < input.length;
        let byte3 = haveByte3 ? input[i + 2]! : 0;

        let outByte1 = byte1 >> 2;
        let outByte2 = ((byte1 & 0x03) << 4) | (byte2 >> 4);
        let outByte3 = ((byte2 & 0x0F) << 2) | (byte3 >> 6);
        let outByte4 = byte3 & 0x3F;

        if (!haveByte3) {
            outByte4 = 64;

            if (!haveByte2) {
                outByte3 = 64;
            }
        }

        output.push(
            byteToCharMap[outByte1]!, byteToCharMap[outByte2]!,
            byteToCharMap[outByte3]!, byteToCharMap[outByte4]!
        );
    }

    return output.join("");
}

const BlobE = g["Blob"] || BlobP;
export { BlobE as Blob };
