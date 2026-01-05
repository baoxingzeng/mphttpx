import { suite } from "uvu";
import * as assert from "uvu/assert";
import { ui_rec, config } from "./utils.js";
import { BlobP as Blob } from "../dist/index.esm.js";
import { FormDataP as FormData } from "../dist/index.esm.js";
import { AbortControllerP as AbortController } from "../dist/index.esm.js";
import { fetchP as fetch } from "../dist/index.esm.js";

const _name = "fetch";
const _test = suite(_name);

/**
 * @param {string} n 
 * @param {Parameters<typeof _test>[1]} t 
 */
const test = (n, t) => {
    return _test(...ui_rec(_name, n, t));
}

test("fetch basic GET request", async () => {
    let response = await fetch(config.api_prefix + "/api/user?id=88");
    assert.equal(response.ok, true);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    let data = await response.json();
    assert.equal(data.id, "88");
    assert.equal(data.name, "张三🎉");
    assert.equal(data.age, 25);
});

test("fetch POST request (FormData upload)", async () => {
    let formData = new FormData();
    formData.append("name", "李四");
    formData.append("age", "26");
    let fileContent = "This is the content of the test file.";
    let blob = new Blob([fileContent], { type: "text/plain" });
    formData.append("file", blob, "test-file.txt");
    let response = await fetch(config.api_prefix + "/api/upload", {
        method: "POST",
        body: formData,
        headers: {
            "X-Custom-Header": "polyfill-test"
        },
    });
    assert.equal(response.status, 201);
    let data = await response.json();
    assert.equal(data.code, 0);
    assert.equal(data.message, "success");
    assert.equal(data.data.name, "李四");
    assert.equal(data.data.age, "26");
    assert.equal(data.data.file.filename, "test-file.txt");
    assert.equal(data.data.file.content, fileContent);
});

test("fetch abort request (AbortController)", async () => {
    let controller = new AbortController();
    let signal = controller.signal;
    let fetchPromise = fetch(config.api_prefix + "/api/timeout", { signal });
    controller.abort();
    let abortError = null;
    try {
        await fetchPromise;
    } catch (e) {
        abortError = e;
    }
    assert.ok(abortError instanceof Error);
    assert.equal(abortError.name, "AbortError");
    assert.equal(signal.aborted, true);
});

test("fetch dealing with 404 error response", async () => {
    let response = await fetch(config.api_prefix + "/api/not-found");
    assert.equal(response.ok, false);
    assert.equal(response.status, 404);
    let data = await response.json();
    assert.equal(data.code, 404);
    assert.equal(data.message, "Not Found");
});

test("fetch custom request header", async () => {
    let response = await fetch(config.api_prefix + "/api/header-test", {
        headers: {
            "X-Token": "123456789",
            "Content-Type": "application/json"
        }
    });

    let data = await response.json();
    assert.equal(data.token, "123456789");
    assert.equal(data.contentType, "application/json");
});

export default _test;
