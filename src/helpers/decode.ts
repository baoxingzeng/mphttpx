import { TextDecoderP } from "../encoding/TextDecoderP";

/** @internal */
export function decode(buf?: AllowSharedBufferSource) {
    let decoder = new TextDecoderP();
    return decoder.decode(buf);
}
