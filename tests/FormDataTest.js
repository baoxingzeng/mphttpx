import { suite } from "uvu";
import * as assert from "uvu/assert";
import { ui_rec } from "./utils.js";
import { BlobP as Blob } from "../dist/index.esm.js";
import { FileP as File } from "../dist/index.esm.js";
import { FormDataP as FormData } from "../dist/index.esm.js";

const _name = "FormData";
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
 * @param {globalThis.FormData} formData 
 * @param {[string, FormDataEntryValue][]} expectedEntries 
 */
const compare = (formData, expectedEntries) => {
    let actual = Array.from(formData.entries());
    assert.equal(JSON.stringify(actual), JSON.stringify(expectedEntries));
}

test("FormData basic initialization + core operations (append/set/get/getAll/has/delete)", () => {
    let formData = new FormData();
    formData.append("username", "zhangsan");
    formData.append("age", "20");
    formData.append("hobby", "coding");
    formData.append("hobby", "gaming");
    compare(formData, [["username", "zhangsan"], ["age", "20"], ["hobby", "coding"], ["hobby", "gaming"]]);
    let file = new File(["file content"], "test.txt", { type: "text/plain" });
    let blob = new Blob(["blob content"], { type: "application/octet-stream" });
    formData.append("avatar", file);
    formData.append("file", blob, "custom-blob.txt");
    compare(formData, [["username", "zhangsan"], ["age", "20"], ["hobby", "coding"], ["hobby", "gaming"], ["avatar", file], ["file", blob]]);
    assert.equal(formData.get("username"), "zhangsan");
    assert.equal(formData.get("hobby"), "coding");
    assert.equal(formData.get("avatar"), file);
    assert.equal(formData.get("nonexist"), null);
    assert.equal(JSON.stringify(formData.getAll("hobby")), JSON.stringify(["coding", "gaming"]));
    assert.equal(JSON.stringify(formData.getAll("username")), JSON.stringify(["zhangsan"]));
    assert.equal(JSON.stringify(formData.getAll("nonexist")), JSON.stringify([]));
    assert.equal(formData.has("age"), true);
    assert.equal(formData.has("avatar"), true);
    assert.equal(formData.has("nonexist"), false);
    formData.set("hobby", "reading");
    formData.set("newkey", "newval");
    compare(formData, [["username", "zhangsan"], ["age", "20"], ["hobby", "reading"], ["avatar", file], ["file", blob], ["newkey", "newval"]]);
    formData.delete("newkey");
    formData.delete("avatar");
    compare(formData, [["username", "zhangsan"], ["age", "20"], ["hobby", "reading"], ["file", blob]]);
    formData.delete("nonexist");
});

test("FormData traversal methods (keys/values/entries/forEach)", () => {
    let formData = new FormData();
    formData.append("a", "1");
    formData.append("b", "2");
    formData.append("a", "3");
    let file = new File([], "test.txt");
    formData.append("file", file);
    assert.equal(JSON.stringify(Array.from(formData.keys())), JSON.stringify(["a", "b", "a", "file"]));
    let values = Array.from(formData.values());
    assert.equal(values[0], "1");
    assert.equal(values[3], file);
    assert.equal(
        JSON.stringify(Array.from(formData.entries()).map(([k, v]) => [k, v instanceof File ? "File" : v])),
        JSON.stringify([["a", "1"], ["b", "2"], ["a", "3"], ["file", "File"]])
    );
    let log = [];
    formData.forEach((v, k) => {
        log.push(`${k}=${v instanceof File ? "File" : v}`);
    });
    assert.equal(log.join(","), "a=1,b=2,a=3,file=File");
});

test("append/set special scenarios (File/Blob filename, null value, type conversion)", () => {
    let formData = new FormData();
    let blob = new Blob(["test"], { type: "text/plain" });
    formData.append("blob", blob, "my-blob.txt");
    let blobValue = formData.get("blob");
    assert.equal(blobValue.name, "my-blob.txt");
    formData.append("blob2", blob);
    let blobValue2 = formData.get("blob2");
    assert.equal(blobValue2.name, "blob");
    // @ts-ignore
    formData.append("num", 123);
    // @ts-ignore
    formData.append("bool", true);
    assert.equal(formData.get("num"), "123");
    assert.equal(formData.get("bool"), "true");
    formData.append("empty", "");
    // @ts-ignore
    formData.append("nullval", null);
    // @ts-ignore
    formData.append("undefval", undefined);
    assert.equal(formData.get("empty"), "");
    assert.equal(formData.get("nullval"), "null");
    assert.equal(formData.get("undefval"), "undefined");
});

test("FormData edge scenes: repeating keys, null keys, special character keys", () => {
    let formData = new FormData();
    formData.append("", "empty-key");
    assert.equal(formData.get(""), "empty-key");
    assert.equal(formData.has(""), true);
    formData.append("用户名", "张三");
    formData.append("🎉", "emoji-key");
    formData.append("key&=?", "special-val");
    assert.equal(formData.get("用户名"), "张三");
    assert.equal(formData.get("🎉"), "emoji-key");
    assert.equal(formData.get("key&=?"), "special-val");
});

test("FormData strictly distinguish between File/Blob and regular strings", () => {
    let formData = new FormData();
    let file = new File(["content"], "test.txt");
    let blob = new Blob(["content"]);
    let str = "content";
    formData.append("file", file);
    formData.append("blob", blob);
    formData.append("str", str);

    assert.instance(formData.get("file"), File);
    assert.instance(formData.get("blob"), Blob);
    assert.type(formData.get("str"), "string");
});

_test.run();
