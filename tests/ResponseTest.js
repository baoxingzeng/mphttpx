import { suite } from "uvu";
import * as assert from "uvu/assert";
import { ui_rec } from "./utils.js";
import { BlobP as Blob } from "../dist/esm/index.js";
import { FormDataP as FormData } from "../dist/esm/index.js";
import { HeadersP as Headers } from "../dist/esm/index.js";
import { RequestP as Request } from "../dist/esm/index.js";
import { ResponseP as Response } from "../dist/esm/index.js";

const _name = "Response";
export const _test = suite(_name);

/**
 * @param {string} n 
 * @param {Parameters<typeof _test>[1]} t 
 */
const test = (n, t) => {
    return _test(...ui_rec(_name, n, t));
}

test("Response basic construction (status code + configuration items)", () => {
    let res1 = new Response();
    assert.equal(res1.status, 200);
    assert.equal(res1.statusText, "");
    assert.equal(res1.ok, true);
    assert.instance(res1.headers, Headers);
    let customHeaders = new Headers({
        "Content-Type": "application/json",
        "X-Response": "polyfill"
    });
    let res2 = new Response(JSON.stringify({ code: 0 }), {
        status: 201,
        statusText: "Created",
        headers: customHeaders
    });

    assert.equal(res2.status, 201);
    assert.equal(res2.statusText, "Created");
    assert.equal(res2.ok, true);
    assert.equal(res2.headers.get("content-type"), "application/json");
    assert.equal(res2.bodyUsed, false);
    let res3 = new Response(JSON.stringify({ code: -1 }), { status: 404 });
    assert.equal(res3.ok, false);
    assert.equal(res3.statusText, "");
});

test("Response body handling (different types of bodies)", async () => {
    let res1 = new Response("hello=world", {
        headers: { "Content-Type": "text/plain" }
    });
    assert.equal(await res1.text(), "hello=world");
    assert.equal(res1.bodyUsed, true);
    let res2 = new Response(JSON.stringify({ name: "张三" }), {
        headers: { "Content-Type": "application/json" }
    });
    let jsonResult = await res2.json();
    assert.equal(jsonResult.name, "张三");
    let blob = new Blob(["blob content"], { type: "text/plain" });
    let res3 = new Response(blob);
    let blobResult = await res3.blob();
    assert.instance(blobResult, Blob);
    assert.equal(await blobResult.text(), "blob content");
    let uint8 = new Uint8Array([72, 101, 108, 108, 111]);
    let res4 = new Response(uint8.buffer);
    let abResult = await res4.arrayBuffer();
    assert.equal(new Uint8Array(abResult)[4], 111);
    let formData = new FormData();
    formData.append("name", "张三");
    let res5 = new Response(formData);
    let formDataResult = await res5.formData();
    assert.equal(formDataResult.get("name"), "张三");
});

test("Response static methods (json/redirect/error)", () => {
    // @ts-ignore
    let jsonRes = Response.json({ code: 0, data: "test" }, { status: 200 });
    assert.equal(jsonRes.headers.get("content-type"), "application/json");
    assert.equal(jsonRes.status, 200);
    let redirectRes = Response.redirect("https://test.com/new", 302);
    assert.equal(redirectRes.status, 302);
    assert.equal(redirectRes.headers.get("location"), "https://test.com/new");
    let errorRes = Response.error();
    assert.equal(errorRes.status, 0);
    assert.equal(errorRes.ok, false);
    assert.equal(errorRes.type, "error");
});

test("clone clone instance", async () => {
    let res = new Response("clone test", {
        status: 200,
        headers: { "X-Clone": "true" }
    });
    let clonedRes = res.clone();
    assert.equal(clonedRes.status, res.status);
    assert.equal(await clonedRes.text(), "clone test");
    assert.equal(clonedRes.headers.get("x-clone"), "true");
    await res.text();
    assert.throws(() => res.clone(), (err) => err instanceof TypeError);
});

test("Request → Response linkage: simulate Request Response process", async () => {
    let req = new Request("https://test.com/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: 1 })
    });

    let reqBody = JSON.parse(await req.text());
    assert.equal(reqBody.id, 1);
    assert.equal(req.headers.get("content-type"), "application/json");
    let res = new Response(JSON.stringify({ id: 1, name: "张三" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
    let resBody = await res.json();
    assert.equal(resBody.name, "张三");
    assert.equal(res.ok, true);
});
