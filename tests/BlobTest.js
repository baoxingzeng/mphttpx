import { suite } from "uvu";
import * as assert from "uvu/assert";
import { ui_rec } from "./utils.js";
import { TextEncoderP as TextEncoder } from "../dist/index.esm.js";
import { BlobP as Blob } from "../dist/index.esm.js";

const _name = "Blob";
const _test = suite(_name);

/**
 * @param {string} n 
 * @param {Parameters<typeof _test>[1]} t 
 */
const test = (n, t) => {
    return _test(...ui_rec(_name, n, t));
}

/**
 * 
 * @param {globalThis.Blob} blob 
 * @param {string} expectedType 
 * @param {number} expectedSize 
 */
const compare = (blob, expectedType, expectedSize) => {
    assert.equal(blob.type, expectedType);
    assert.equal(blob.size, expectedSize);
}

test("Blob construct empty content", () => {
    let blob1 = new Blob();
    compare(blob1, "", 0);
    let blob2 = new Blob([]);
    compare(blob2, "", 0);
    let blob3 = new Blob([], { type: "" });
    compare(blob3, "", 0);
});

test("Blob construct content containing strings", () => {
    let blob1 = new Blob(["Hello World"]);
    compare(blob1, "", 11);
    let blob2 = new Blob(["Hello", " ", "World!"], { type: "text/plain" });
    compare(blob2, "text/plain", 12);
    let str = "你好🎉";
    let blob3 = new Blob([str], { type: "text/plain;charset=utf-8" });
    compare(blob3, "text/plain;charset=utf-8", (new TextEncoder()).encode(str).length);
});

test("Blob construct content containing an ArrayBuffer/Uint8Array", () => {
    let u8array = new Uint8Array([72, 101, 108, 108, 111]);
    let blob1 = new Blob([u8array], { type: "application/octet-stream" });
    compare(blob1, "application/octet-stream", 5);
    let arrbuf = u8array.buffer;
    let blob2 = new Blob([arrbuf], { type: "application/octet-stream" });
    compare(blob2, "application/octet-stream", 5);
    let blob3 = new Blob([u8array, " World"], { type: "text/plain" });
    compare(blob3, "text/plain", 5 + 6);
});

test("Blob construct content containing nested blob", () => {
    let innerBlob = new Blob(["Hello"]);
    let outerBlob = new Blob([innerBlob, " World"], { type: "text/plain" });
    compare(outerBlob, "text/plain", 11);
});

test("Blob type: automatic lowercase", () => {
    let blob1 = new Blob([], { type: "TEXT/PLAIN" });
    assert.equal(blob1.type, "text/plain");
    let blob2 = new Blob([], { type: "invalid-type-123" });
    assert.equal(blob2.type, "invalid-type-123");
});

test("slice basic slicing", async () => {
    let str = "Hello World";
    let blob = new Blob([str], { type: "text/plain" });
    let slice1 = blob.slice(0, 5);
    compare(slice1, "", 5);
    let text1 = await slice1.text();
    assert.equal(text1, "Hello");
    let slice2 = blob.slice(6, 11);
    let text2 = await slice2.text();
    assert.equal(text2, "World");
    let slice3 = blob.slice(8, 20);
    let text3 = await slice3.text();
    assert.equal(text3, "rld");
    let slice4 = blob.slice(-5);
    let text4 = await slice4.text();
    assert.equal(text4, "World");
});

test("slice specify type", async () => {
    let blob = new Blob(["Hello"], { type: "text/plain" });
    let sliced = blob.slice(0, 5, "application/json");
    assert.equal(sliced.type, "application/json");
    let text = await sliced.text();
    assert.equal(text, "Hello");
});

test("text read text content", async () => {
    let blob1 = new Blob(["Hello World"], { type: "text/plain" });
    assert.equal(await blob1.text(), "Hello World");
    let str = "小程序🎉";
    let blob2 = new Blob([str], { type: "text/plain;charset=utf-8" });
    assert.equal(await blob2.text(), str);
    let blob3 = new Blob();
    assert.equal(await blob3.text(), "");
});

test("arrayBuffer read binary content", async () => {
    let uint8 = new Uint8Array([72, 101, 108, 108, 111]);
    let blob = new Blob([uint8], { type: "application/octet-stream" });
    let ab = await blob.arrayBuffer();
    let resultU8 = new Uint8Array(ab);
    assert.equal(resultU8.length, 5);
    assert.equal(resultU8[0], 72);
    assert.equal(resultU8[4], 111);
    let emptyBlob = new Blob();
    let emptyAb = await emptyBlob.arrayBuffer();
    assert.equal(emptyAb.byteLength, 0);
});

test("Blob contains ultra large string content", async () => {
    let bigStr = "a".repeat(100000);
    let blob = new Blob([bigStr], { type: "text/plain" });
    assert.equal(blob.size, 100000);
    let text = await blob.text();
    assert.equal(text.length, 100000);
    assert.equal(text[99999], "a");
});

test("Blob contains mixed type content", async () => {
    let parts = [
        "Hello",
        new Uint8Array([32]),
        new TextEncoder().encode("World").buffer,
        "🎉",
    ];
    let blob = new Blob(parts, { type: "text/plain" });
    assert.equal(blob.size, 15);
    let text = await blob.text();
    assert.equal(text, "Hello World🎉");
});

_test.run();
