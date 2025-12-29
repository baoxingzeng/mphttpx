import { suite } from "uvu";
import * as assert from "uvu/assert";
import { ui_rec } from "./utils";
import { AbortControllerP as AbortController } from "../../../../src/AbortControllerP";
import { AbortSignalP as AbortSignal } from "../../../../src/AbortSignalP";

const _name = "AbortController";
const _test = suite(_name);

const test = (n: string, t: Parameters<typeof _test>[1]) => {
    return _test(...ui_rec(_name, n, t));
}

test("AbortController basic initialization + signal property", () => {
    let controller = new AbortController();
    assert.instance(controller.signal, AbortSignal);
    assert.equal(controller.signal.aborted, false);
});

test("abort trigger abort (core function)", () => {
    let controller = new AbortController();
    let signal = controller.signal;
    let abortTriggered = false;
    let abortHandler = () => {
        abortTriggered = true;
    };
    signal.addEventListener("abort", abortHandler);
    controller.abort();
    assert.equal(signal.aborted, true);
    assert.equal(abortTriggered, true);
    signal.removeEventListener("abort", abortHandler);
    abortTriggered = false;
    controller.abort();
    assert.equal(abortTriggered, false);
});

test("abort reason for transmission termination", () => {
    let controller1 = new AbortController();
    controller1.abort();
    // @ts-ignore
    assert.instance(controller1.signal.reason, Error);
    let customReason = new Error("user initiated termination");
    let controller2 = new AbortController();
    // @ts-ignore
    controller2.abort(customReason);
    // @ts-ignore
    assert.equal(controller2.signal.reason, customReason);
    // @ts-ignore
    controller2.abort(new Error("repeated termination"));
    // @ts-ignore
    assert.equal(controller2.signal.reason, customReason);
});

test("AbortSignal.abort create aborted signal", () => {
    // @ts-ignore
    let signal1 = AbortSignal.abort();
    assert.equal(signal1.aborted, true);
    // @ts-ignore
    assert.instance(signal1.reason, Error);
    let reason = "timeout termination";
    // @ts-ignore
    let signal2 = AbortSignal.abort(reason);
    assert.equal(signal2.aborted, true);
    // @ts-ignore
    assert.equal(signal2.reason, reason);
});

test("AbortSignal.timeout timed termination", async () => {
    let delay = 100;
    // @ts-ignore
    let signal = AbortSignal.timeout(delay);
    assert.equal(signal.aborted, false);
    await new Promise(resolve => setTimeout(resolve, delay + 100));
    assert.equal(signal.aborted, true);
    // @ts-ignore
    assert.equal(signal.reason.name, "TimeoutError");
    // @ts-ignore
    let signal0 = AbortSignal.timeout(0);
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(signal0.aborted, true);
});

test("AbortSignal.onabort callback", () => {
    let controller = new AbortController();
    let signal = controller.signal;
    let onAbortCalled = false;
    signal.onabort = () => {
        onAbortCalled = true;
    };
    controller.abort();
    assert.equal(onAbortCalled, true);
    onAbortCalled = false;
    signal.onabort = () => {
        onAbortCalled = true;
    };
    controller.abort();
    assert.equal(onAbortCalled, false);
});

test("AbortController/AbortSignal edge scenes: multiple abort()/ unbound listening/ early termination", () => {
    let controller1 = new AbortController();
    controller1.abort();
    controller1.abort();
    controller1.abort();
    assert.equal(controller1.signal.aborted, true);
    let controller2 = new AbortController();
    assert.not.throws(() => controller2.abort());
    let controller3 = new AbortController();
    controller3.abort();
    let lateHandlerCalled = false;
    controller3.signal.addEventListener("abort", () => {
        lateHandlerCalled = true;
    });
    assert.equal(lateHandlerCalled, false);
});

_test.run();
