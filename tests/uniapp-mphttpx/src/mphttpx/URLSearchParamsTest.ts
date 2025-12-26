import { suite } from "uvu";
import * as assert from "uvu/assert";
import { ui_rec } from "./utils";
// import { URLSearchParams } from "../../../../src/URLSearchParamsP";
import { URLSearchParamsP as URLSearchParams } from "../../../../src/URLSearchParamsP";

const _name = "URLSearchParams";
const _test = suite(_name);

const test = (n: string, t: Parameters<typeof _test>[1]) => {
    return _test(...ui_rec(_name, n, t));
}

const compare = (params: URLSearchParams, expectedEntries: [string, string][]) => {
  let actual = Array.from(params.entries()).sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));
  let expected = [...expectedEntries].sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
};

test("URLSearchParams the constructor supports multi-format input parameters", () => {
    let p1 = new URLSearchParams();
    compare(p1, []);
    let p2 = new URLSearchParams("name=张三&age=20&hobby=code&hobby=game");
    compare(p2, [["name", "张三"], ["age", "20"], ["hobby", "code"], ["hobby", "game"]]);
    let p3 = new URLSearchParams("?name=李四&gender=男");
    compare(p3, [["name", "李四"], ["gender", "男"]]);
    let p4 = new URLSearchParams([["a", "1"], ["b", "2"], ["a", "3"]]);
    compare(p4, [["a", "1"], ["b", "2"], ["a", "3"]]);
    let p5 = new URLSearchParams({ x: "foo", y: "bar" });
    compare(p5, [["x", "foo"], ["y", "bar"]]);
    let p6 = new URLSearchParams(p5);
    compare(p6, [["x", "foo"], ["y", "bar"]]);
    assert.is.not(p6, p5);
});

test("URLSearchParams core operation methods (append/set/get/getAll/has/delete)", () => {
    let params = new URLSearchParams();
    params.append("fruit", "apple");
    params.append("fruit", "banana");
    compare(params, [["fruit", "apple"], ["fruit", "banana"]]);
    assert.equal(params.get("fruit"), "apple");
    assert.equal(params.get("none"), null);
    assert.equal(JSON.stringify(params.getAll("fruit")), JSON.stringify(["apple", "banana"]));
    assert.equal(JSON.stringify(params.getAll("none")), JSON.stringify([]));
    assert.equal(params.has("fruit"), true);
    assert.equal(params.has("none"), false);
    params.set("fruit", "orange");
    compare(params, [["fruit", "orange"]]);
    params.set("newkey", "newval");
    compare(params, [["fruit", "orange"], ["newkey", "newval"]]);
    params.delete("newkey");
    compare(params, [["fruit", "orange"]]);
    params.delete("none");
    params.delete("fruit");
    compare(params, []);
});

test("URLSearchParams iteration methods (keys/values/entries/forEach)", () => {
    let params = new URLSearchParams("a=1&b=2&a=3");
    assert.equal(JSON.stringify(Array.from(params.keys())), JSON.stringify(["a", "b", "a"]));
    assert.equal(JSON.stringify(Array.from(params.values())), JSON.stringify(["1", "2", "3"]));
    assert.equal(JSON.stringify(Array.from(params.entries())), JSON.stringify([["a", "1"], ["b", "2"], ["a", "3"]]));
    let log: string[] = [];
    params.forEach((v, k) => log.push(`${k}=${v}`));
    assert.equal(log.join(","), "a=1,b=2,a=3");
});

test("toString serialize query string", () => {
    let p1 = new URLSearchParams({ name: "张三", age: "20" });
    assert.equal(p1.toString(), "name=%E5%BC%A0%E4%B8%89&age=20");
    let p2 = new URLSearchParams("a=1 2&b=3&4&c=5=6");
    assert.equal(p2.toString(), "a=1+2&b=3&4=&c=5%3D6");
    let p3 = new URLSearchParams("empty=&nullval");
    assert.equal(p3.toString(), "empty=&nullval=");
    let p4 = new URLSearchParams();
    assert.equal(p4.toString(), "");
});

test("sort ascending sort (stable sort)", () => {
    let params = new URLSearchParams("b=2&a=1&c=3&a=4");
    params.sort();
    assert.equal(Array.from(params.entries()).join(","), [["a", "1"], ["a", "4"], ["b", "2"], ["c", "3"]].join(","));
    let emptyParams = new URLSearchParams();
    assert.not.throws(() => emptyParams.sort());
});

test("URLSearchParams edge scene (repeated key/ null key/ null value/ special character)", () => {
    let p1 = new URLSearchParams("=emptykey&=another");
    compare(p1, [["", "emptykey"], ["", "another"]]);
    assert.equal(p1.get(""), "emptykey");
    let p2 = new URLSearchParams("key1=&key2&key3=null");
    compare(p2, [["key1", ""], ["key2", ""], ["key3", "null"]]);
    assert.equal(p2.get("key1"), "");
    let p3 = new URLSearchParams({ emoji: "🎉", fullwidth: "１２３" });
    assert.equal(p3.get("emoji"), "🎉");
    assert.equal(p3.get("fullwidth"), "１２３");
    assert.ok(p3.toString().includes("emoji=%F0%9F%8E%89"));
    let encodedStr = "name=%E5%BC%A0%E4%B8%89&age=20";
    let p4 = new URLSearchParams(encodedStr);
    assert.equal(p4.get("name"), "张三");
});

_test.run();
