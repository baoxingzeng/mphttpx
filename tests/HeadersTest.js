import { suite } from "uvu";
import * as assert from "uvu/assert";
import { ui_rec } from "./utils.js";
import { HeadersP as Headers } from "../dist/index.esm.js";

const _name = "Headers";
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
 * @param {globalThis.Headers} headers 
 * @param {[string, string][]} expectedEntries 
 */
const compare = (headers, expectedEntries) => {
    let actual = Array.from(headers.entries()).map(([k, v]) => [k.toLowerCase(), v]);
    let expected = expectedEntries.map(([k, v]) => [k.toLowerCase(), v]);
    assert.equal(JSON.stringify(actual.sort()), JSON.stringify(expected.sort()));
}

test("Headers constructor supports multi format input parameters", () => {
    let h1 = new Headers();
    compare(h1, []);
    let h2 = new Headers([
        ["Content-Type", "application/json"],
        ["Accept", "text/plain"],
        ["X-Custom-Header", "test"]
    ]);
    compare(
        h2,
        [["Content-Type", "application/json"], ["Accept", "text/plain"], ["X-Custom-Header", "test"]],
    );
    let h3 = new Headers({
        "content-type": "text/html",
        "cache-control": "no-cache",
        "x-token": "123456"
    });
    compare(
        h3,
        [["content-type", "text/html"], ["cache-control", "no-cache"], ["x-token", "123456"]],
    );
    let h4 = new Headers(h3);
    compare(h4, Array.from(h3.entries()));
    assert.is.not(h4, h3);
    let iterable = {
        *[Symbol.iterator]() {
            yield ["User-Agent", "polyfill-test"];
            yield ["Referer", "https://test.com"];
        }
    };
    let h5 = new Headers(iterable);
    compare(
        h5,
        [["User-Agent", "polyfill-test"], ["Referer", "https://test.com"]],
    );
});

test("Headers core operations: append/set/get/has/delete (case insensitive)", () => {
    let headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("content-type", "charset=utf-8");
    headers.append("X-Header", "val1");
    headers.append("X-Header", "val2");
    compare(
        headers,
        [["Content-Type", "application/json, charset=utf-8"], ["X-Header", "val1, val2"]],
    );
    assert.equal(headers.get("content-type"), "application/json, charset=utf-8");
    assert.equal(headers.get("CONTENT-TYPE"), "application/json, charset=utf-8");
    assert.equal(headers.get("X-Header"), "val1, val2");
    assert.equal(headers.get("Nonexist"), null);
    assert.equal(headers.has("content-type"), true);
    assert.equal(headers.has("X-HEADER"), true);
    assert.equal(headers.has("Nonexist"), false);
    headers.set("Content-Type", "text/plain");
    headers.set("new-header", "new-val");
    compare(
        headers,
        [["Content-Type", "text/plain"], ["X-Header", "val1, val2"], ["new-header", "new-val"]],
    );
    headers.delete("x-header");
    headers.delete("NEW-HEADER");
    compare(
        headers,
        [["Content-Type", "text/plain"]],
    );
    headers.delete("Nonexist");
});

test("Headers traversal methods: keys/values/entries/forEach (keys in lowercase)", () => {
    let headers = new Headers([
        ["Content-Type", "application/json"],
        ["Accept", "text/plain"],
        ["X-Custom", "test"]
    ]);
    assert.equal(
        JSON.stringify(Array.from(headers.keys()).sort()),
        JSON.stringify(["accept", "content-type", "x-custom"]),
    );
    assert.equal(
        JSON.stringify(Array.from(headers.values()).sort()),
        JSON.stringify(["application/json", "test", "text/plain"]),
    );
    assert.equal(
        JSON.stringify(Array.from(headers.entries()).map(([k, v]) => [k, v]).sort()),
        JSON.stringify([["accept", "text/plain"], ["content-type", "application/json"], ["x-custom", "test"]]),
    );
    let log = [];
    headers.forEach((v, k) => log.push(`${k}=${v}`));
    assert.equal(
        log.sort().join(","),
        ["accept=text/plain", "content-type=application/json", "x-custom=test"].sort().join(","),
    );
});

test("Headers edge scenes: invalid keys/ null values", () => {
    let headers = new Headers();
    assert.throws(() => headers.append("", "empty-key"), (err) => err instanceof TypeError);
    assert.throws(() => headers.set("", "empty-key"), (err) => err instanceof TypeError);
    assert.throws(() => headers.append("invalid key", "val"), (err) => err instanceof TypeError);
    assert.throws(() => headers.set("key\nwith\nnewline", "val"), (err) => err instanceof TypeError);
    headers.append("Empty-Value", "");
    assert.equal(headers.get("Empty-Value"), "");
    assert.equal(headers.has("Empty-Value"), true);
    headers.append("Empty-Value", "new-val");
    assert.equal(headers.get("Empty-Value"), ", new-val");
});

_test.run();
