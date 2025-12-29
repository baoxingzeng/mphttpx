import { suite } from "uvu";
import * as assert from "uvu/assert";
import { ui_rec } from "./utils";
import { BlobP as Blob } from "../../../../src/BlobP";
import { FileP as File } from "../../../../src/FileP";
import { URLSearchParamsP as URLSearchParams } from "../../../../src/URLSearchParamsP";
import { FormDataP as FormData } from "../../../../src/FormDataP";
import { HeadersP as Headers } from "../../../../src/HeadersP";
import { RequestP as Request } from "../../../../src/RequestP";

const _name = "Request";
const _test = suite(_name);

const test = (n: string, t: Parameters<typeof _test>[1]) => {
    return _test(...ui_rec(_name, n, t));
}

test("Request basic construction (URL + configuration items)", () => {
    let req1 = new Request("https://test.com/api");
    assert.equal(req1.url, "https://test.com/api");
    assert.equal(req1.method, "GET");
    assert.equal(req1.credentials, "same-origin");
    assert.instance(req1.headers, Headers);
    let customHeaders = new Headers({
        "Content-Type": "application/json",
        "X-Test": "polyfill"
    });
    let req2 = new Request("https://test.com/post", {
        method: "POST",
        headers: customHeaders,
        body: JSON.stringify({ name: "张三" }),
        credentials: "include",
        cache: "no-cache",
    });
    assert.equal(req2.method, "POST");
    assert.equal(req2.credentials, "include");
    assert.equal(req2.cache, "no-cache");
    assert.equal(req2.headers.get("content-type"), "application/json");
    assert.equal(req2.bodyUsed, false);
});

test("Request body handling (various types of body)", async () => {
    let req1 = new Request("https://test.com/post", {
        method: "POST",
        body: "hello=world"
    });
    assert.equal(await req1.text(), "hello=world");
    assert.equal(req1.bodyUsed, true);
    let formData = new FormData();
    formData.append("name", "张三");
    formData.append("age", "25");
    let req2 = new Request("https://test.com/form", {
        method: "POST",
        body: formData,
    });
    assert.ok(req2.headers.get("Content-Type")?.startsWith("multipart/form-data; boundary="));
    let formDataResult = await req2.formData();
    assert.equal(formDataResult.get("name"), "张三");
    let blob = new Blob([".white { color: #fff; }"], { type: "text/css" });
    let req3 = new Request("https://test.com/file", {
        method: "POST",
        body: blob
    });
    assert.equal(req3.headers.get("Content-Type"), "text/css");
    let blobResult = await req3.blob();
    assert.instance(blobResult, Blob);
    assert.equal(await blobResult.text(), ".white { color: #fff; }");
    let file = new File(["<div></div>"], "file.txt", { type: "text/html" });
    let req3F = new Request("https://test.com/file", {
        method: "POST",
        body: file
    });
    assert.equal(req3F.headers.get("Content-Type"), "text/html");
    let fileResult = await req3F.blob();
    assert.instance(fileResult, Blob);
    assert.equal(await fileResult.text(), "<div></div>");
    let searchParams = new URLSearchParams({ a: "1", b: "2" });
    let req4 = new Request("https://test.com/search", {
        method: "POST",
        body: searchParams
    });
    assert.ok(req4.headers.get("Content-Type")?.startsWith("application/x-www-form-urlencoded"));
    assert.equal(await req4.text(), "a=1&b=2");
    let uint8 = new Uint8Array([72, 101, 108, 108, 111]);
    let req5 = new Request("https://test.com/binary", {
        method: "POST",
        body: uint8.buffer
    });
    let abResult = await req5.arrayBuffer();
    assert.equal(new Uint8Array(abResult)[0], 72);
    assert.throws(
        () => new Request("https://test.com/get", { method: "GET", body: "test" }),
        (err: unknown) => err instanceof TypeError,
    );
    assert.throws(
        () => new Request("https://test.com/head", { method: "HEAD", body: "test" }),
        (err: unknown) => err instanceof TypeError,
    );
});

test("clone clone instance", async () => {
    let req = new Request("https://test.com/post", {
        method: "POST",
        body: "clone test",
        headers: { "X-Clone": "true" }
    });
    let clonedReq = req.clone();
    assert.equal(clonedReq.url, req.url);
    assert.equal(clonedReq.method, req.method);
    assert.equal(await clonedReq.text(), "clone test");
    assert.equal(clonedReq.headers.get("x-clone"), "true");
    await req.text();
    assert.throws(() => req.clone(), (err: unknown) => err instanceof TypeError);
});

_test.run();
