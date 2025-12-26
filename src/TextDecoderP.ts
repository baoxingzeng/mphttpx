import { g, polyfill, dfStringTag } from "./isPolyfill";

/** @internal */
const state = Symbol(/* "TextDecoderState" */);

export class TextDecoderP implements TextDecoder {
    constructor(utfLabel = "utf-8", { fatal = false, ignoreBOM = false } = {}) {
        if (UTF8Labels.indexOf(utfLabel.toLowerCase()) === -1) {
            throw new RangeError("TextDecoder: The encoding label provided ('" + utfLabel + "') is invalid.");
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

    decode(buffer?: Parameters<TextDecoder["decode"]>[0], { stream = false } = {}) {
        const that = this[state];
        let buf: Uint8Array;

        if (typeof buffer !== "undefined") {
            if (buffer instanceof ArrayBuffer) {
                buf = new Uint8Array(buffer);
            } else if (buffer instanceof Uint8Array) {
                buf = buffer;
            } else if (ArrayBuffer.isView(buffer)) {
                buf = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
            } else {
                throw new TypeError("Failed to execute 'decode' on 'TextDecoder': parameter 1 is not of type 'ArrayBuffer'.");
            }
        } else {
            if (that[_partial].length > 0) {
                if (this.fatal) {
                    throw new TypeError("TextDecoder: Incomplete UTF-8 sequence.");
                } else {
                    that[_partial] = [];
                }
            }
            return "";
        }

        if (!that[_bomSeen] && buf.length >= 3) {
            if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
                buf = buf.subarray(3);                                  // × WeChat 2.5.0
                that[_bomSeen] = true;
            }
        }

        if (that[_partial].length > 0) {
            let merged = new Uint8Array(that[_partial].length + buf.length);
            merged.set(that[_partial], 0);
            merged.set(buf, that[_partial].length);
            buf = merged;
            that[_partial] = [];
        }

        let end = buf.length;
        let res: number[] = [];

        if (stream && buf.length > 0) {
            let i = buf.length;
            while (i > 0 && i > buf.length - 4) {
                let byte = buf[i - 1]!;
                if ((byte & 0b11000000) !== 0b10000000) {
                    let len = getBytesPerSequence(byte);
                    if (len > buf.length - (i - 1)) { end = i - 1; }
                    break;
                }
                i--;
            }

            that[_partial] = Array.from(buf.slice(end)); // save tail   // × WeChat 2.5.0
            buf = buf.slice(0, end);                                    // × WeChat 2.5.0
        }

        let i = 0;
        while (i < end) {
            let firstByte = buf[i]!;
            let codePoint: number | null = null;
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
                        secondByte = buf[i + 1]!;
                        if ((secondByte & 0xC0) === 0x80) {
                            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
                            if (tempCodePoint > 0x7F) {
                                codePoint = tempCodePoint;
                            }
                        }
                        break;
                    case 3:
                        secondByte = buf[i + 1]!;
                        thirdByte = buf[i + 2]!;
                        if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
                            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
                            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                                codePoint = tempCodePoint;
                            }
                        }
                        break;
                    case 4:
                        secondByte = buf[i + 1]!;
                        thirdByte = buf[i + 2]!;
                        fourthByte = buf[i + 3]!;
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
                    throw new TypeError("TextDecoder.decode: Decoding failed.")
                } else {
                    res.push(0xFFFD);
                    let skip = 1;
                    while (i + skip < end && (buf[i + skip]! & 0b11000000) === 0b10000000) {
                        skip += 1;
                    }
                    i += skip;
                    continue;
                }
            } else if (codePoint > 0xFFFF) {
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

    toString() { return "[object TextDecoder]"; }
    get isPolyfill() { return { symbol: polyfill, hierarchy: ["TextDecoder"] }; }
}

dfStringTag(TextDecoderP, "TextDecoder");

/** @internal */ const _bomSeen = Symbol();
/** @internal */ const _partial = Symbol();

/** @internal */
class TextDecoderState {
    fatal = false;
    ignoreBOM = false;

    [_bomSeen] = false;
    [_partial]: number[] = [];
}

const UTF8Labels = ["utf-8", "utf8", "unicode-1-1-utf-8"];

function getBytesPerSequence(byte: number) {
    return (byte > 0xEF) ? 4 : (byte > 0xDF) ? 3 : (byte > 0xBF) ? 2 : 1;
}

const buildString = (res: number[]) => {
    let arr: string[] = [];
    for (let j = 0, len = res.length; j < len; j += 0x1000) {
        arr.push(String.fromCharCode.apply(String, res.slice(j, j + 0x1000)));
    }
    return arr.join("");
}

const concatString = (res: number[]) => {
    let str = "";
    for (let j = 0, len = res.length; j < len; j += 0x1000) {
        str += String.fromCharCode.apply(String, res.slice(j, j + 0x1000));
    }
    return str;
}

const TextDecoderE = g["TextDecoder"] || TextDecoderP;
export { TextDecoderE as TextDecoder };
