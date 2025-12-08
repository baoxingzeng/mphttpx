import { TextEncoderP } from "./TextEncoderP";
import { TextDecoderP } from "./TextDecoderP";
import { g, polyfill, isPolyfillType, defineStringTag } from "./isPolyfill";

const state = Symbol(/* "BlobState" */);
export { state as blobState };

export class BlobP implements Blob {
    constructor(blobParts: BlobPart[] = [], options?: BlobPropertyBag) {
        if (!Array.isArray(blobParts)) {
            throw new TypeError("First argument to Blob constructor must be an Array.");
        }

        let encoder: TextEncoderP | null = null;
        let chunks = blobParts.reduce((chunks: Array<TUint8ArrayOfArrayBuffer>, part) => {
            if (isPolyfillType<Blob>("Blob", part)) {
                chunks.push((part as BlobP)[state][_u8array]);
            } else if (part instanceof ArrayBuffer || ArrayBuffer.isView(part)) {
                chunks.push(convert(part));
            } else {
                if (!encoder) { encoder = new TextEncoderP(); }
                chunks.push(encoder.encode(String(part)));
            }

            return chunks;
        }, []);

        this[state] = new BlobState(concat(chunks));
        const that = this[state];

        that.size = that[_u8array].length;

        const rawType = options?.type || "";
        that.type = /[^\u0020-\u007E]/.test(rawType) ? "" : rawType.toLowerCase();
    }

    [state]: BlobState;

    get size() { return this[state].size; }
    get type() { return this[state].type; }

    arrayBuffer(): Promise<ArrayBuffer> {
        return Promise.resolve(clone(this[state][_u8array].buffer).buffer);
    }

    bytes(): Promise<TUint8ArrayOfArrayBuffer> {
        return Promise.resolve(clone(this[state][_u8array].buffer));
    }

    slice(start?: number, end?: number, contentType?: string): Blob {
        const sliced = this[state][_u8array].slice(start ?? 0, end ?? this[state][_u8array].length);
        return new BlobP([sliced], { type: contentType ?? "" });
    }

    stream(): ReadableStream<TUint8ArrayOfArrayBuffer> {
        throw new ReferenceError("ReadableStream is not defined");
    }

    text(): Promise<string> {
        const decoder = new TextDecoderP();
        return Promise.resolve(decoder.decode(this[state][_u8array]));
    }

    toString() { return "[object Blob]"; }
    get isPolyfill() { return { symbol: polyfill, hierarchy: ["Blob"] }; }
}

defineStringTag(BlobP, "Blob");

export const _u8array = Symbol();

class BlobState {
    constructor(buffer: TUint8ArrayOfArrayBuffer) {
        this[_u8array] = buffer;
    }

    size = 0;
    type = "";
    [_u8array]: TUint8ArrayOfArrayBuffer;
}

export type TUint8ArrayOfArrayBuffer = ReturnType<TextEncoder["encode"]>;

export function u8array2base64(input: TUint8ArrayOfArrayBuffer) {
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

function convert(buf: BufferSource): TUint8ArrayOfArrayBuffer {
    return buf instanceof ArrayBuffer
        ? new Uint8Array(buf)
        : new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

function clone(buf: BufferSource) {
    const sourceArray = convert(buf);
    const cloneArray = new Uint8Array(new ArrayBuffer(sourceArray.byteLength));

    cloneArray.set(sourceArray);
    return cloneArray;
}

function concat(chunks: Uint8Array[]) {
    const totalByteLength = chunks.reduce((acc, cur) => acc + cur.byteLength, 0);
    const result = new Uint8Array(totalByteLength);

    chunks.reduce((offset, chunk) => {
        result.set(chunk, offset);
        return offset + chunk.byteLength;
    }, 0);

    return result;
}

const BlobE = g["Blob"] || BlobP;
export { BlobE as Blob };
