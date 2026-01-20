import { TextEncoderP } from "./TextEncoderP";
import { TextDecoderP } from "./TextDecoderP";
import { g, polyfill, Class_setStringTag, isPolyfillType, isArrayBuffer } from "./isPolyfill";

/** @internal */
const state = Symbol(/* "BlobState" */);

export class BlobP implements Blob {
    constructor(blobParts: BlobPart[] = [], options?: BlobPropertyBag) {
        if (!(Array.isArray(blobParts) || (blobParts && typeof blobParts === "object" && Symbol.iterator in blobParts))) {
            throw new TypeError("Failed to construct 'Blob/File': The provided value cannot be converted to a sequence.");
        }

        let _blobParts = Array.isArray(blobParts) ? blobParts : Array.from<BlobPart>(blobParts as never);
        let chunks: Uint8Array[] = [];

        for (let i = 0; i < _blobParts.length; ++i) {
            let chunk = _blobParts[i]!;

            if (isPolyfillType<Blob>("Blob", chunk)) {
                chunks.push((chunk as BlobP)[state][_buffer]);
            }

            else if (isArrayBuffer(chunk) || ArrayBuffer.isView(chunk)) {
                chunks.push(BufferSource_toUint8Array(chunk));
            }

            else {
                chunks.push(encode("" + chunk));
            }
        }

        this[state] = new BlobState(concat(chunks));
        const s = this[state];

        s.size = s[_buffer].length;

        let rawType = "" + (options?.type || "");
        s.type = /[^\u0020-\u007E]/.test(rawType) ? "" : rawType.toLowerCase();
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
        let sliced = this[state][_buffer].slice(start ?? 0, end ?? this[state][_buffer].length);    // × WeChat 2.5.0
        return new BlobP([sliced], { type: "" + (contentType ?? "") });
    }

    stream(): ReturnType<Blob["stream"]> {
        throw new TypeError("Failed to execute 'stream' on 'Blob': method not implemented.");
    }

    text(): Promise<string> {
        return Promise.resolve(decode(this[state][_buffer]));
    }

    /** @internal */ toString() { return "[object Blob]"; }
    /** @internal */ get isPolyfill() { return { symbol: polyfill, hierarchy: ["Blob"] }; }
}

Class_setStringTag(BlobP, "Blob");

/** @internal */
const _buffer = Symbol();

/** @internal */
class BlobState {
    constructor(buffer: InstanceType<typeof Uint8Array>) {
        this[_buffer] = buffer;
    }

    size = 0;
    type = "";
    [_buffer]: InstanceType<typeof Uint8Array>;
}

/** @internal */
export function Blob_toUint8Array(blob: Blob) {
    return (blob as BlobP)[state][_buffer];
}

function BufferSource_toUint8Array(buf: BufferSource): InstanceType<typeof Uint8Array> {
    return isArrayBuffer(buf)
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
export function encode(str?: string) {
    let encoder = new TextEncoderP();
    return encoder.encode(str);
}

/** @internal */
export function decode(buf?: Parameters<TextDecoder["decode"]>[0]) {
    let decoder = new TextDecoderP();
    return decoder.decode(buf);
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
