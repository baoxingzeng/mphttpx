import { g, polyfill, Class_setStringTag, checkArgsLength, isObjectType } from "./isPolyfill";

export class TextEncoderP implements TextEncoder {
    get encoding() { return "utf-8"; }

    encode(input = "") {
        let _input = "" + input;
        return encodeText(_input).encoded;
    }

    encodeInto(...args: Parameters<TextEncoder["encodeInto"]>): TextEncoderEncodeIntoResult {
        const [source, destination] = args;
        checkArgsLength(args, 2, "TextEncoder", "encodeInto");

        let _source = "" + source;
        if (!(destination instanceof Uint8Array || isObjectType<Uint8Array>("Uint8Array", destination))) {
            throw new TypeError("Failed to execute 'encodeInto' on 'TextEncoder': parameter 2 is not of type 'Uint8Array'.");
        }

        let result = encodeText(_source, destination);
        return { read: result.read, written: result.written };
    }

    /** @internal */ toString() { return "[object TextEncoder]"; }
    /** @internal */ get isPolyfill() { return { symbol: polyfill, hierarchy: ["TextEncoder"] }; }
}

Class_setStringTag(TextEncoderP, "TextEncoder");

function encodeText(input: string, destination?: Uint8Array) {
    const HAS_DESTINATION = typeof destination !== "undefined";

    let pos = 0;
    let read = 0;
    let len = input.length;

    let at = 0;                                                                     // output position
    let tlen = Math.max(32, len + (len >> 1) + 7);                                  // 1.5x size
    let target = HAS_DESTINATION ? destination : new Uint8Array((tlen >> 3) << 3);  // ... but at 8 byte offset

    while (pos < len) {
        let value = input.charCodeAt(pos);
        let codeUnitCount = 1;

        if (value >= 0xd800 && value <= 0xdbff) {
            // high surrogate
            if (pos + 1 < len) {
                let extra = input.charCodeAt(pos + 1);
                if ((extra & 0xfc00) === 0xdc00) {
                    codeUnitCount = 2;
                    pos += 2;
                    value = ((value & 0x3ff) << 10) + (extra & 0x3ff) + 0x10000;
                } else {
                    pos += 1;
                    value = 0xfffd;
                }
            } else {
                pos += 1;
                value = 0xfffd;
            }
        } else if (value >= 0xdc00 && value <= 0xdfff) {
            pos += 1;
            value = 0xfffd;
        } else {
            pos += 1;
        }

        // expand the buffer if we couldn't write 4 bytes
        if (!HAS_DESTINATION && at + 4 > target.length) {
            tlen += 8;                                  // minimum extra
            tlen *= (1.0 + (pos / input.length) * 2);   // take 2x the remaining
            tlen = (tlen >> 3) << 3;                    // 8 byte offset

            let update = new Uint8Array(tlen);
            update.set(target); target = update;
        }

        let byteCount: 1 | 2 | 3 | 4;

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

        switch (byteCount) {
            case 1:                                             // 1-byte
                target[at++] = value;                           // ASCII
                break;

            case 2:                                             // 2-byte
                target[at++] = ((value >> 6) & 0x1f) | 0xc0;
                target[at++] = (value & 0x3f) | 0x80;
                break;

            case 3:                                             // 3-byte
                target[at++] = ((value >> 12) & 0x0f) | 0xe0;
                target[at++] = ((value >> 6) & 0x3f) | 0x80;
                target[at++] = (value & 0x3f) | 0x80;
                break;

            case 4:                                             // 4-byte
                target[at++] = ((value >> 18) & 0x07) | 0xf0;
                target[at++] = ((value >> 12) & 0x3f) | 0x80;
                target[at++] = ((value >> 6) & 0x3f) | 0x80;
                target[at++] = (value & 0x3f) | 0x80;
                break;
        }

        read += codeUnitCount;
    }

    return {
        encoded: !HAS_DESTINATION ? target.slice(0, at) : destination,
        read: read,
        written: at,
    };
}

const TextEncoderE = g["TextEncoder"] || TextEncoderP;
export { TextEncoderE as TextEncoder };
