import { SymbolP, setState } from "../utils";
import { isArrayBuffer } from "../helpers/isArrayBuffer";

const validLabels = ["utf-8", "utf8", "unicode-1-1-utf-8"];

export class TextDecoderP implements TextDecoder {
    constructor(label = "utf-8", options?: TextDecoderOptions) {
        if (validLabels.indexOf((typeof label === "string" ? label : ("" + label)).toLowerCase()) === -1) {
            throw new RangeError(`Failed to construct 'TextDecoder': encoding ('${label}') not implemented.`);
        }
        setState(this, "__TextDecoder__", new TextDecoderState(options));
    }

    /** @internal */ declare readonly __TextDecoder__: TextDecoderState;

    get encoding(): string { return "utf-8"; }
    get fatal(): boolean { return state(this).fatal; }
    get ignoreBOM(): boolean { return state(this).ignoreBOM; }

    decode(input?: AllowSharedBufferSource, options?: TextDecodeOptions): string {
        return decodeText(input, options, state(this));
    }

    /** @internal */ toString() { return "[object TextDecoder]"; }
    /** @internal */ get [SymbolP.toStringTag]() { return "TextDecoder"; }
    /** @internal */ get __MPHTTPX__() { return { chain: ["TextDecoder"] }; }
}

/** @internal */
class TextDecoderState {
    constructor({ fatal = false, ignoreBOM = false } = {}) {
        this.fatal = !!fatal;
        this.ignoreBOM = !!ignoreBOM;
    }
    fatal: boolean;
    ignoreBOM: boolean;
    initial = 0;
    partial: number[] = [];
}

function state(target: TextDecoderP) {
    return target.__TextDecoder__;
}

function decodeText(input?: AllowSharedBufferSource, { stream = false } = {}, settings = { fatal: false, ignoreBOM: false, initial: 0, partial: [] as number[] }): string {
    if (input === undefined) {
        if (settings.partial.length > 0) {
            if (settings.fatal) {
                settings.partial = [];
                throw new TypeError("Incomplete UTF-8 sequence.");
            }
        }
        return "";
    }

    let bytes = isArrayBuffer(input)
        ? new Uint8Array(input)
        : ArrayBuffer.isView(input)
            ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
            : (() => { throw new TypeError("Input could not be converted to any of: ArrayBufferView, ArrayBuffer."); })();

    if (settings.initial < 3) {
        settings.initial += bytes.length; if (bytes.length >= 3) {
            if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
                bytes = bytes.subarray(3);                              // × WeChat 2.5.0
            }
        }
    }

    if (settings.partial.length > 0) {
        let merged = new Uint8Array(settings.partial.length + bytes.length);
        merged.set(settings.partial, 0);
        merged.set(bytes, settings.partial.length);
        bytes = merged; settings.partial = [];
    }

    let end = bytes.length;
    let res: number[] = [];

    if (stream && bytes.length > 0) {
        let i = bytes.length;
        while (i > 0 && i > bytes.length - 4) {
            let byte = bytes[i - 1]!;
            if ((byte & 0b11000000) !== 0b10000000) {
                let len = (byte > 0xEF) ? 4 : (byte > 0xDF) ? 3 : (byte > 0xBF) ? 2 : 1;
                if (len > bytes.length - (i - 1)) { end = i - 1; }
                break;
            }
            --i;
        }

        settings.partial = Array.from(bytes.slice(end)); // save tail   // × WeChat 2.5.0
        bytes = bytes.slice(0, end);                                    // × WeChat 2.5.0
    }

    let codePoint = 0;
    let tempCodePoint = 0;
    let bytesPerSequence = 0;
    let firstByte = 0, secondByte = 0, thirdByte = 0, fourthByte = 0;

    let i = 0;
    while (i < end) {
        codePoint = 0;
        firstByte = bytes[i]!;
        bytesPerSequence = (firstByte > 0xEF) ? 4 : (firstByte > 0xDF) ? 3 : (firstByte > 0xBF) ? 2 : 1;

        if (i + bytesPerSequence <= end) {
            switch (bytesPerSequence) {
                case 1:
                    if (firstByte < 0x80) {
                        codePoint = firstByte;
                    }
                    break;

                case 2:
                    secondByte = bytes[i + 1]!;
                    if ((secondByte & 0xC0) === 0x80) {
                        tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
                        if (tempCodePoint > 0x7F) {
                            codePoint = tempCodePoint;
                        }
                    }
                    break;

                case 3:
                    secondByte = bytes[i + 1]!;
                    thirdByte = bytes[i + 2]!;
                    if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
                        tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
                        if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                            codePoint = tempCodePoint;
                        }
                    }
                    break;

                case 4:
                    secondByte = bytes[i + 1]!;
                    thirdByte = bytes[i + 2]!;
                    fourthByte = bytes[i + 3]!;
                    if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
                        tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
                        if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                            codePoint = tempCodePoint;
                        }
                    }
                    break;
            }
        }

        if (codePoint === 0 && ((bytesPerSequence === 1 && firstByte !== 0) || bytesPerSequence > 1)) {
            if (settings.fatal) {
                settings.partial = [];
                throw new TypeError("Decoding failed.")
            }

            let skip = 1;
            while (i + skip < end && (bytes[i + skip]! & 0b11000000) === 0b10000000) {
                skip += 1;
            }

            // we did not generate a valid codePoint so insert a replacement char (U+FFFD)
            res.push(0xFFFD);
            i += skip; continue;
        }

        else if (codePoint > 0xFFFF) {
            // encode to utf16 (surrogate pair dance)
            codePoint -= 0x10000;
            res.push(codePoint >>> 10 & 0x3FF | 0xD800);
            codePoint = 0xDC00 | codePoint & 0x3FF;
        }

        res.push(codePoint);
        i += bytesPerSequence;
    }

    return res.length > 0x4000 ? buildString(res) : concatString(res);
}

function buildString(val: number[]) {
    let arr: string[] = [];
    for (let i = 0, len = val.length; i < len; i += 0x1000) {
        arr.push(String.fromCharCode.apply(String, val.slice(i, i + 0x1000)));
    }
    return arr.join("");
}

function concatString(val: number[]) {
    let str = "";
    for (let i = 0, len = val.length; i < len; i += 0x1000) {
        str += String.fromCharCode.apply(String, val.slice(i, i + 0x1000));
    }
    return str;
}

const TextDecoderE = (typeof TextDecoder !== "undefined" && TextDecoder) || TextDecoderP;
export { TextDecoderE as TextDecoder };
