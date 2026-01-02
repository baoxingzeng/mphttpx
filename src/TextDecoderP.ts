import { g, polyfill, Class_setStringTag } from "./isPolyfill";

/** @internal */
const state = Symbol(/* "TextDecoderState" */);

/** @type {typeof globalThis.TextDecoder} */
export class TextDecoderP implements TextDecoder {
    constructor(label = "utf-8", { fatal = false, ignoreBOM = false } = {}) {
        let _label = "" + label;
        if (["utf-8", "utf8", "unicode-1-1-utf-8"].indexOf(_label.toLowerCase()) === -1) {
            throw new RangeError(`Failed to construct 'TextDecoder': encoding ('${_label}') not implemented.`);
        }

        this[state] = new TextDecoderState();
        this[state].fatal = !!fatal;
        this[state].ignoreBOM = !!ignoreBOM;
    }

    /** @internal */
    [state]: TextDecoderState;

    get encoding() { return "utf-8"; }
    get fatal() { return this[state].fatal; }
    get ignoreBOM() { return this[state].ignoreBOM; }

    decode(input?: Parameters<TextDecoder["decode"]>[0], { stream = false } = {}) {
        const s = this[state];
        let bytes: Uint8Array;

        if (input !== undefined) {
            if (input instanceof ArrayBuffer) {
                bytes = new Uint8Array(input);
            } else if (input instanceof Uint8Array) {
                bytes = input;
            } else if (ArrayBuffer.isView(input)) {
                bytes = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
            } else {
                throw new TypeError("Failed to execute 'decode' on 'TextDecoder': parameter 1 is not of type 'ArrayBuffer'.");
            }
        } else {
            if (s[_partial].length > 0) {
                if (this.fatal) {
                    s[_partial] = [];
                    throw new TypeError("TextDecoder: Incomplete UTF-8 sequence.");
                }
            }
            return "";
        }

        if (s[_bomDone] < 3) {
            s[_bomDone] += bytes.length;
            if (bytes.length >= 3) {
                if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
                    bytes = bytes.subarray(3);                              // × WeChat 2.5.0
                }
            }
        }

        if (s[_partial].length > 0) {
            let merged = new Uint8Array(s[_partial].length + bytes.length);
            merged.set(s[_partial], 0);
            merged.set(bytes, s[_partial].length);
            bytes = merged; s[_partial] = [];
        }

        let end = bytes.length;
        let res: number[] = [];

        if (stream && bytes.length > 0) {
            let i = bytes.length;
            while (i > 0 && i > bytes.length - 4) {
                let byte = bytes[i - 1]!;
                if ((byte & 0b11000000) !== 0b10000000) {
                    let len = getBytesPerSequence(byte);
                    if (len > bytes.length - (i - 1)) { end = i - 1; }
                    break;
                }
                i--;
            }

            s[_partial] = Array.from(bytes.slice(end)); // save tail        // × WeChat 2.5.0
            bytes = bytes.slice(0, end);                                    // × WeChat 2.5.0
        }

        let i = 0;
        while (i < end) {
            let codePoint: number | null = null;
            let firstByte = bytes[i]!;
            let bytesPerSequence = getBytesPerSequence(firstByte);

            if (i + bytesPerSequence <= end) {
                let secondByte: number, thirdByte: number, fourthByte: number, tempCodePoint: number;

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

            if (codePoint === null) {
                if (this.fatal) {
                    s[_partial] = [];
                    throw new TypeError("TextDecoder.decode: Decoding failed.")
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

    /** @internal */ toString() { return "[object TextDecoder]"; }
    /** @internal */ get isPolyfill() { return { symbol: polyfill, hierarchy: ["TextDecoder"] }; }
}

Class_setStringTag(TextDecoderP, "TextDecoder");

/** @internal */ const _bomDone = Symbol();
/** @internal */ const _partial = Symbol();

/** @internal */
class TextDecoderState {
    fatal = false;
    ignoreBOM = false;

    [_bomDone] = 0;
    [_partial]: number[] = [];
}

function getBytesPerSequence(byte: number) {
    return (byte > 0xEF) ? 4 : (byte > 0xDF) ? 3 : (byte > 0xBF) ? 2 : 1;
}

const buildString = (res: number[]) => {
    let arr: string[] = [];
    for (let i = 0, len = res.length; i < len; i += 0x1000) {
        arr.push(String.fromCharCode.apply(String, res.slice(i, i + 0x1000)));
    }
    return arr.join("");
}

const concatString = (res: number[]) => {
    let str = "";
    for (let i = 0, len = res.length; i < len; i += 0x1000) {
        str += String.fromCharCode.apply(String, res.slice(i, i + 0x1000));
    }
    return str;
}

const TextDecoderE = g["TextDecoder"] || TextDecoderP;
export { TextDecoderE as TextDecoder };
