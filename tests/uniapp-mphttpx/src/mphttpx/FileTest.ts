import { suite } from "uvu";
import * as assert from "uvu/assert";
import { ui_rec } from "./utils";
// import { File } from "../../../../src/FileP";
import { FileP as File } from "../../../../src/FileP";

const _name = "File";
const _test = suite(_name);

const test = (n: string, t: Parameters<typeof _test>[1]) => {
    return _test(...ui_rec(_name, n, t));
}

const compare = (file: globalThis.File, expectedName: string, expectedLastModified: number) => {
    assert.equal(file.name, expectedName);
    assert.equal(file.lastModified, expectedLastModified);
}

test("name keep the incoming file name as is", () => {
    assert.equal((new File([], "/path/to/test.txt")).name, "/path/to/test.txt");
    assert.equal((new File([], "C:\\folder\\demo.json")).name, "C:\\folder\\demo.json");
    assert.equal((new File([], "src/assets/img.png")).name, "src/assets/img.png");
    assert.equal((new File([], "/")).name, "/");
    assert.equal((new File([], "")).name, "");
    assert.equal((new File([], "readme.md")).name, "readme.md");
    assert.equal((new File([], "File@Name#123.txt")).name, "File@Name#123.txt");
});

test("lastModified custom value + default value", () => {
    let file1 = new File([], "custom.txt", { lastModified: 1719235200000 });
    compare(file1, "custom.txt", 1719235200000);
    let before = Date.now();
    let file2 = new File([], "default.txt");
    let after = Date.now();
    assert.ok(file2.lastModified >= before && file2.lastModified <= after);
});

test("slice return Blob instead of File", () => {
    let file = new File(["test"], "slice.txt");
    let sliced = file.slice(0, 2);
    assert.not.instance(sliced, File);
});

_test.run();
