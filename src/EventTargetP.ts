import { EventP } from "./EventP";
import { g, state as eventState, polyfill, defineStringTag } from "./isPolyfill";

const state = Symbol("EventTargetState");
export { state as eventTargetState };

export class EventTargetP implements EventTarget {
    constructor() {
        this[state] = new EventTargetState(this);
    }

    [state]: EventTargetState;

    addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean) {
        const executor = new Executor(type, callback);
        executor.options.capture = typeof options === "boolean" ? options : !!options?.capture;

        if (!this[state].executors.some(x => x.equals(executor))) {
            if (typeof options === "object") {
                const { once, passive, signal } = options;

                executor.options.once = !!once;
                executor.options.passive = !!passive;

                if (signal) {
                    executor.options.signal = signal;
                    this[state].reply(signal, executor);
                }
            }

            this[state].executors.push(executor);

            const f = (v: Executor) => !!v.options.capture ? 0 : 1;
            this[state].executors = this[state].executors.sort((a, b) => f(a) - f(b));
        }
    }

    dispatchEvent(event: Event) {
        if (typeof event !== "object") {
            throw new TypeError("EventTarget.dispatchEvent: Argument 1 is not an object.");
        }

        if (!(event instanceof EventP)) {
            throw new TypeError("EventTarget.dispatchEvent: Argument 1 does not implement interface Event.");
        }

        const s = event[eventState];
        s.target = this;
        s.isTrusted = false;

        return this[state].fire(event);
    }

    removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean) {
        const executor = new Executor(type, callback);
        executor.options.capture = typeof options === "boolean" ? options : !!options?.capture;

        if (this[state].executors.some(x => x.equals(executor))) {
            this[state].executors = this[state].executors.filter(x => !x.equals(executor));
        }
    }

    toString() { return "[object EventTarget]"; }
    get isPolyfill() { return { symbol: polyfill, hierarchy: ["EventTarget"] }; }
}

defineStringTag(EventTargetP, "EventTarget");

export class EventTargetState {
    constructor(target: EventTargetP) {
        this.target = target;
    }

    target: EventTargetP;
    executors = [] as Executor[];

    fire(event: EventP) {
        const s = event[eventState];
        if (!event.target) s.target = this.target;

        s.currentTarget = this.target;
        s.eventPhase = EventP.AT_TARGET;
        s._dispatched = true;

        const onceIndexes: number[] = [];

        for (let i = 0; i < this.executors.length; ++i) {
            const executor = this.executors[i]!;
            if (executor.type !== event.type) continue;

            s._passive = !!executor.options.passive;
            if (executor.options.once) onceIndexes.push(i);

            try {
                const { callback: cb } = executor;
                if (typeof cb === "function") cb.call(this.target, event);
            } catch (e) {
                console.error(e);
            }

            s._passive = false;
            if (s._stopImmediatePropagationCalled) break;
        }

        if (onceIndexes.length > 0) {
            this.executors = this.executors.reduce((acc: Executor[], cur, index) => {
                if (!onceIndexes.includes(index)) acc.push(cur);
                return acc;
            }, []);
        }

        s.currentTarget = null;
        s.eventPhase = EventP.NONE;
        s._dispatched = false;

        return !(event.cancelable && s._preventDefaultCalled);
    }

    reply(signal: AbortSignal, executor: Executor) {
        try {
            const onAbort = () => {
                this.executors = this.executors.filter(x => !x.equals(executor));
                signal.removeEventListener("abort", onAbort);
            }

            signal.addEventListener("abort", onAbort);
        } catch (e) {
            console.error(e);
        }
    }
}

class Executor {
    static extract(cb: EventListenerOrEventListenerObject | null): EventListener | null {
        if (typeof cb === "function") {
            return cb;
        } else if (isEventListenerObject(cb)) {
            return cb.handleEvent;
        } else {
            return cb;
        }
    }

    constructor(type: string, callback: EventListenerOrEventListenerObject | null) {
        this.type = String(type);
        this.callback = Executor.extract(callback);
    }

    type: string;
    callback: EventListener | null;

    options: AddEventListenerOptions = {};

    equals(executor: Executor) {
        return Object.is(this.type, executor.type) && Object.is(this.callback, executor.callback)
            && Object.is(this.options.capture, executor.options.capture);
    }
}

function isEventListenerObject(cb: EventListenerObject | null): cb is EventListenerObject {
    return !!cb && "handleEvent" in cb && typeof cb.handleEvent === "function";
}

export function attachFn(this: EventTarget, type: string, cb: Function | null, listener: EventListener) {
    if (typeof cb === "function") {
        this.addEventListener(type, listener);
    } else {
        this.removeEventListener(type, listener);
    }
}

export function executeFn(this: EventTarget, cb: Function | null, ev: Event) {
    if (typeof cb === "function") cb.call(this, ev);
}

const EventTargetE = g["EventTarget"] || EventTargetP;
export { EventTargetE as EventTarget };
