import { suite } from "uvu";
import * as assert from "uvu/assert";
import { ui_rec } from "./utils";
import { TextEncoder } from "../../../../src/TextEncoderP";

const name = "TextEncoder";
const test = suite(name);

const encoder = new TextEncoder();

// @ts-ignore
// 辅助函数：对比 Uint8Array 内容是否完全一致
const assertUint8ArrayEqual = (actual, expected, message) => {
    // 先校验类型
    assert.instance(actual, Uint8Array, `${message}：返回值不是 Uint8Array`);
    // 校验长度
    assert.equal(actual.length, expected.length, `${message}：字节长度不一致`);
    // 逐字节校验
    for (let i = 0; i < actual.length; i++) {
        assert.equal(actual[i], expected[i], `${message}：索引 ${i} 字节值不一致`);
    }
};

test(...ui_rec(name, "encode 空字符串", () => {
    const result = encoder.encode('');
    assertUint8ArrayEqual(result, new Uint8Array([]), '空字符串编码');
}));

test.run();
