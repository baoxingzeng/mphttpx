import { describe } from "./ui-test-utils";
import { TextEncoder } from "../../../../src/TextEncoderP";

const predicate = (encoded: InstanceType<typeof Uint8Array>, u8array: InstanceType<typeof Uint8Array>) => {
    if (encoded.length !== u8array.length) {
        return false;
    }
    for (let i = 0; i < encoded.length; i++) {
        if (encoded[i] !== u8array[i]) {
            return false;
        }
    }
    return true;
}

describe(
    "TextEncoder",
    "encoding",
    "should be 'utf-8'",
    cb => {
        let encoder = new TextEncoder();
        cb(encoder.encoding === "utf-8");
    }
)

describe(
    "TextEncoder",
    "encode(string)",
    "'€' should be [226, 130, 172]",
    cb => {
        let encoder = new TextEncoder();
        let encoded = encoder.encode("€");
        let u8array = new Uint8Array([226, 130, 172]);
        cb(predicate(encoded, u8array));
    },
);

describe(
    "TextEncoder",
    "encode(string)",
    "empty string should be []",
    cb => {
        let encoder = new TextEncoder();
        let encoded = encoder.encode("");
        let u8array = new Uint8Array([]);
        cb(predicate(encoded, u8array));
    },
);
