/** @internal */
export function Uint8Array_toBase64(input: Uint8Array<ArrayBuffer>) {
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
