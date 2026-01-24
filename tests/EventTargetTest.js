import { suite } from "uvu";
import * as assert from "uvu/assert";
import { ui_rec } from "./utils.js";
import { EventTargetP as EventTarget } from "../dist/esm/index.js";
import { EventP as Event } from "../dist/esm/index.js";

const _name = "EventTarget";
export const _test = suite(_name);

/**
 * @param {string} n 
 * @param {Parameters<typeof _test>[1]} t 
 */
const test = (n, t) => {
    return _test(...ui_rec(_name, n, t));
}

test("Event basic construction and read-only properties", () => {
    let event1 = new Event("click");
    assert.equal(event1.type, "click");
    assert.equal(event1.bubbles, false);
    assert.equal(event1.cancelable, false);
    assert.equal(event1.target, null);
    assert.equal(event1.currentTarget, null);
    assert.equal(event1.defaultPrevented, false);
    let event2 = new Event("custom", {
        bubbles: true,
        cancelable: true
    });
    assert.equal(event2.type, "custom");
    assert.equal(event2.cancelable, true);
    assert.equal(event2.bubbles, true);
});

test("Event.preventDefault & defaultPrevented", () => {
    let nonCancelableEvent = new Event("non-cancel");
    nonCancelableEvent.preventDefault();
    assert.equal(nonCancelableEvent.defaultPrevented, false);
    let cancelableEvent = new Event("cancelable", { cancelable: true });
    cancelableEvent.preventDefault();
    assert.equal(cancelableEvent.defaultPrevented, true);
    cancelableEvent.preventDefault();
    assert.equal(cancelableEvent.defaultPrevented, true);
});

test("EventTarget addEventListener/removeEventListener", () => {
    let target = new EventTarget();
    let clickCount = 0;
    let clickHandler = (e) => {
        clickCount++;
        assert.equal(e.type, "click");
        assert.equal(e.target, target);
        assert.equal(e.currentTarget, target);
    };
    // @ts-ignore
    target.addEventListener("click", clickHandler);
    target.dispatchEvent(new Event("click"));
    assert.equal(clickCount, 1);
    // @ts-ignore
    target.removeEventListener("click", clickHandler);
    target.dispatchEvent(new Event("click"));
    assert.equal(clickCount, 1);
    assert.not.throws(() => {
        target.removeEventListener("click", () => { });
    });
});

test("EventTarget support binding multiple processors to the same event", () => {
    let target = new EventTarget();
    let log = [];
    let handler1 = () => log.push("handler1");
    let handler2 = () => log.push("handler2");
    target.addEventListener("custom", handler1);
    target.addEventListener("custom", handler2);
    target.dispatchEvent(new Event("custom"));
    assert.equal(log.join(","), "handler1,handler2");
    target.removeEventListener("custom", handler1);
    log.length = 0;
    target.dispatchEvent(new Event("custom"));
    assert.equal(log.join(","), "handler2");
});

test("EventTarget trigger non-existent events without reporting errors", () => {
    let target = new EventTarget();
    assert.not.throws(() => {
        target.dispatchEvent(new Event("nonexist"));
    });
});

test("EventTarget bind one-time listening (optional: supports {once: true})", () => {
    let target = new EventTarget();
    let count = 0;
    let onceHandler = () => count++;
    target.addEventListener("once", onceHandler, { once: true });
    target.dispatchEvent(new Event("once"));
    assert.equal(count, 1);
    target.dispatchEvent(new Event("once"));
    assert.equal(count, 1);
});

test("EventTarget instance inheritance (simulating business class inheritance EventTarget)", () => {
    class CustomClass extends EventTarget {
        constructor(name) {
            super();
            this.name = name;
        }
        name = "";
    }
    let customInstance = new CustomClass("test");
    let triggered = false;
    customInstance.addEventListener("custom", (e) => {
        triggered = true;
        assert.equal(e.target, customInstance);
        assert.equal((e.target).name, "test");
    });
    customInstance.dispatchEvent(new Event("custom"));
    assert.equal(triggered, true);
});

test("EventTarget the listening function is null/undefined, and the same function is repeatedly bound", () => {
    let target = new EventTarget();
    assert.not.throws(() => {
        target.addEventListener("click", null);
        // @ts-ignore
        target.addEventListener("click", undefined);
    });
    let handler = () => { };
    target.addEventListener("click", handler);
    target.addEventListener("click", handler);
    let callCount = 0;
    let Dispatch = () => {
        callCount++;
        handler();
        return true;
    };
    target.dispatchEvent = () => Dispatch();
    target.dispatchEvent(new Event("click"));
    assert.equal(callCount, 1);
});
