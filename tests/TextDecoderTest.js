import { suite } from "uvu";
import * as assert from "uvu/assert";
import { ui_rec } from "./utils.js";
import { TextDecoderP as TextDecoder } from "../dist/esm/index.js";

const _name = "TextDecoder";
export const _test = suite(_name);

/**
 * @param {string} n 
 * @param {Parameters<typeof _test>[1]} t 
 */
const test = (n, t) => {
    return _test(...ui_rec(_name, n, t));
}

test("decode ASCII string (single-byte)", () => {
    let decoder = new TextDecoder();
    let decoded = decoder.decode(new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]));
    assert.equal(decoded, "Hello World!");
});

test("decode Chinese characters (multibyte)", () => {
    let decoder = new TextDecoder();
    let decoded = decoder.decode(new Uint8Array([228, 189, 160, 229, 165, 189, 239, 188, 140, 228, 184, 150, 231, 149, 140, 239, 188, 129]));
    assert.equal(decoded, "你好，世界！");
});

test("decode emoji", () => {
    let decoder = new TextDecoder();
    let decoded = decoder.decode(new Uint8Array([240, 159, 142, 137]));
    assert.equal(decoded, "🎉");
});

test("decode unicode supplementary flat characters", () => {
    let decoder = new TextDecoder();
    let decoded = decoder.decode(new Uint8Array([240, 157, 140, 134]));
    assert.equal(decoded, "𝌆");
});

test("decode mixed characters (ascii+emoji)", () => {
    let decoder = new TextDecoder();
    let decoded = decoder.decode(new Uint8Array([65, 240, 159, 142, 137, 66]));
    assert.equal(decoded, "A🎉B");
});

test("decode empty Uint8Array", () => {
    let decoder = new TextDecoder();
    let decoded = decoder.decode(new Uint8Array());
    assert.equal(decoded, "");
});

test("decode incomplete bytes (handling truncation)", () => {
    let decoder = new TextDecoder();
    let decoded = decoder.decode(new Uint8Array([228, 189]));
    assert.equal(decoded, "�");
});

test("decode stream mode: pass in complete bytes in two batches", () => {
    let partial1 = new Uint8Array([228, 189]);
    let partial2 = new Uint8Array([160, 229, 165, 189]);
    let decoder = new TextDecoder();
    assert.equal(decoder.decode(partial1, { stream: true }), "");
    assert.equal(decoder.decode(partial2), "你好");
});

test("decode invalid utf-8 byte sequence", () => {
    let decoder = new TextDecoder();
    assert.equal(decoder.decode(new Uint8Array([0x80])), "�");
    assert.equal(decoder.decode(new Uint8Array([240, 159, 142])), "�");
});

test("decode mixed valid/invalid bytes", () => {
    let decoder = new TextDecoder();
    let decoded = decoder.decode(new Uint8Array([72, 0x80, 101]));
    assert.equal(decoded, "H�e");
});

test("decode utf-8 bytes with BOM", () => {
    let withBOM = new Uint8Array([0xef, 0xbb, 0xbf, 72, 101, 108, 108, 111]);
    let withoutBOM = new Uint8Array([72, 101, 108, 108, 111]);
    let decoder1 = new TextDecoder();
    let decoder2 = new TextDecoder("utf-8", { ignoreBOM: false });
    assert.equal(decoder1.decode(withBOM), "Hello");
    assert.equal(decoder2.decode(withBOM), "Hello");
    assert.equal(decoder1.decode(withoutBOM), "Hello");
});

test("decode control characters (spaces, line breaks, tabs)", () => {
    let decoder = new TextDecoder();
    let decoded = decoder.decode(new Uint8Array([97, 32, 98, 10, 99, 9]));
    assert.equal(decoded, "a b\nc\t");
});
