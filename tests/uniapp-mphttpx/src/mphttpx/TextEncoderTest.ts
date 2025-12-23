import { suite } from "uvu";
import * as assert from "uvu/assert";
import { ui_rec } from "./utils";
import { TextEncoder } from "../../../../src/TextEncoderP";

const _name = "TextEncoder";
const _test = suite(_name);

const test = (n: string, t: Parameters<typeof _test>[1]) => {
    return _test(...ui_rec(_name, n, t));
}

const compare = (actual: Uint8Array, expected: Uint8Array) => {
    assert.equal(actual.length, expected.length);
    for (let i = 0; i < actual.length; ++i) {
        assert.equal(actual[i], expected[i]);
    }
}

test("encoding, should be utf-8", () => {
    let encoder = new TextEncoder();
    assert.is(encoder.encoding, "utf-8");
});

test("encode €, should be Uint8Array(3) [226, 130, 172]", () => {
    let encoder = new TextEncoder();
    let encoded = encoder.encode("€");
    compare(encoded, new Uint8Array([226, 130, 172]));
});

test("encode empty string, should be Uint8Array(0) []", () => {
    let encoder = new TextEncoder();
    let encoded = encoder.encode("");
    compare(encoded, new Uint8Array());
});

test("encode ASCII string (single-byte)", () => {
    let encoder = new TextEncoder();
    let encoded = encoder.encode("Hello World!");
    compare(encoded, new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]));
});

test("encode Chinese characters (multibyte)", () => {
    let encoder = new TextEncoder();
    let encoded = encoder.encode("小程序");
    compare(encoded, new Uint8Array([229, 176, 143, 231, 168, 139, 229, 186, 143]));
});

test("encode Chinese + English", () => {
    let encoder = new TextEncoder();
    let encoded = encoder.encode("你好: World！");
    compare(encoded, new Uint8Array([228, 189, 160, 229, 165, 189, 58, 32, 87, 111, 114, 108, 100, 239, 188, 129]));
});

test("encode special characters + emoji", () => {
    let encoder = new TextEncoder();
    let encoded = encoder.encode("@#$% 🎯 𝓪𝓫");
    compare(encoded, new Uint8Array([64, 35, 36, 37, 32, 240, 159, 142, 175, 32, 240, 157, 147, 170, 240, 157, 147, 171]));
});

test("encode unicode supplementary flat characters", () => {
    let encoder = new TextEncoder();
    let encoded = encoder.encode("𝌆");
    compare(encoded, new Uint8Array([240, 157, 140, 134]));
});

test("encodeInto basic scenario: the buffer is sufficient to accommodate all bytes", () => {
    let encoder = new TextEncoder();
    let dest = new Uint8Array(5);
    let result = encoder.encodeInto("Hello", dest);
    assert.equal(result.read, 5);
    assert.equal(result.written, 5);
    compare(dest, new Uint8Array([72, 101, 108, 108, 111]));
});

test("encodeInto insufficient buffer space: only partial bytes were written", () => {
    let encoder = new TextEncoder();
    let dest = new Uint8Array(5);
    let result = encoder.encodeInto("你好世界", dest);
    assert.equal(result.read, 1);
    assert.equal(result.written, 3);
    compare(dest, new Uint8Array([228, 189, 160, 0, 0]));
});

test("encodeInto empty string: no byte written", () => {
    let encoder = new TextEncoder();
    let dest = new Uint8Array(10);
    let result = encoder.encodeInto("", dest);
    assert.equal(result.read, 0);
    assert.equal(result.written, 0);
    compare(dest, new Uint8Array(10));
});

test("encodeInto mixed characters (ascii+emoji): cross byte scenes", () => {
    let encoder = new TextEncoder();
    let dest = new Uint8Array(10);
    let result = encoder.encodeInto("A🎉B", dest);
    assert.equal(result.read, 4);
    assert.equal(result.written, 6);
    compare(dest, new Uint8Array([65, 240, 159, 142, 137, 66, 0, 0, 0, 0]));
});

test("encodeInto reserve the remaining buffer space after partial writing", () => {
    let encoder = new TextEncoder();
    let dest = new Uint8Array([10, 20, 30, 40, 50]);
    encoder.encodeInto("Hi", dest);
    compare(dest, new Uint8Array([72, 105, 30, 40, 50]));
});

_test.run();
