import { TextEncoderP } from "../encoding/TextEncoderP";

/** @internal */
export function encode(str?: string) {
    let encoder = new TextEncoderP();
    return encoder.encode(str);
}
