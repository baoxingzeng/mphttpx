import { g, polyfill, defineStringTag } from "./isPolyfill";

export class TextEncoderP implements TextEncoder {
    get encoding() { return "utf-8"; }

    encode(input = "") {
        return encodeText(input).encoded;
    }

    encodeInto(source: string, destination: Uint8Array): TextEncoderEncodeIntoResult {
        let result = encodeText(source, destination);
        return { read: result.read, written: result.written };
    }

    toString() { return "[object TextEncoder]"; }
    get isPolyfill() { return { symbol: polyfill, hierarchy: ["TextEncoder"] }; }
}

defineStringTag(TextEncoderP, "TextEncoder");

function encodeText(input: string, destination?: Uint8Array) {
    const HAS_DESTINATION = typeof destination !== "undefined";

    let pos = 0;
    let read = 0;
    let len = input.length;

    let at = 0;                                                                     // output position
    let tlen = Math.max(32, len + (len >> 1) + 7);                                  // 1.5x size
    let target = HAS_DESTINATION ? destination : new Uint8Array((tlen >> 3) << 3);  // ... but at 8 byte offset

    while (pos < len) {
        let value = input.charCodeAt(pos++);
        if (value >= 0xd800 && value <= 0xdbff) {
            // high surrogate
            if (pos < len) {
                let extra = input.charCodeAt(pos);
                if ((extra & 0xfc00) === 0xdc00) {
                    ++pos;
                    value = ((value & 0x3ff) << 10) + (extra & 0x3ff) + 0x10000;
                } else {
                    value = 0xfffd;
                }
            } else {
                value = 0xfffd;
            }
        } else if (value >= 0xdc00 && value <= 0xdfff) {
            value = 0xfffd;
        }

        // expand the buffer if we couldn't write 4 bytes
        if (!HAS_DESTINATION && at + 4 > target.length) {
            tlen += 8;                                  // minimum extra
            tlen *= (1.0 + (pos / input.length) * 2);   // take 2x the remaining
            tlen = (tlen >> 3) << 3;                    // 8 byte offset

            let update = new Uint8Array(tlen);
            update.set(target);
            target = update;
        }

        let byteCount: number;
        if ((value & 0xffffff80) === 0) {           // 1-byte
            byteCount = 1;
        } else if ((value & 0xfffff800) === 0) {    // 2-byte
            byteCount = 2;
        } else if ((value & 0xffff0000) === 0) {    // 3-byte
            byteCount = 3;
        } else if ((value & 0xffe00000) === 0) {    // 4-byte
            byteCount = 4;
        } else {
            value = 0xfffd;
            byteCount = 3;
        }

        if (HAS_DESTINATION && at + byteCount > target.length) {
            break;
        }

        if (byteCount === 1) {                              // 1-byte
            target[at++] = value;                           // ASCII
        } else if (byteCount === 2) {                       // 2-byte
            target[at++] = ((value >> 6) & 0x1f) | 0xc0;
            target[at++] = (value & 0x3f) | 0x80;
        } else if (byteCount === 3) {                       // 3-byte
            target[at++] = ((value >> 12) & 0x0f) | 0xe0;
            target[at++] = ((value >> 6) & 0x3f) | 0x80;
            target[at++] = (value & 0x3f) | 0x80;
        } else if (byteCount === 4) {                       // 4-byte
            target[at++] = ((value >> 18) & 0x07) | 0xf0;
            target[at++] = ((value >> 12) & 0x3f) | 0x80;
            target[at++] = ((value >> 6) & 0x3f) | 0x80;
            target[at++] = (value & 0x3f) | 0x80;
        }

        read++;
    }

    return {
        encoded: !HAS_DESTINATION ? target.slice(0, at) : destination.slice(),
        read: read,
        written: at,
    };
}

const TextEncoderE = g["TextEncoder"] || TextEncoderP;
export { TextEncoderE as TextEncoder };
