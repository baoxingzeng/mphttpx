import { g, polyfill, dfStringTag } from "./isPolyfill";
import { EventP, eventState, Event_setTrusted, type Event_EtFields, Event_getEtField, Event_setEtField } from "./EventP";

const passive: Event_EtFields["Passive"] = 0;
const dispatched: Event_EtFields["Dispatched"] = 1;
const preventDefaultCalled: Event_EtFields["PreventDefaultCalled"] = 2;
const stopImmediatePropagationCalled: Event_EtFields["StopImmediatePropagationCalled"] = 3;

/** @internal */ const state = Symbol(/* "EventTargetState" */);
/** @internal */ export { state as eventTargetState };

export class EventTargetP implements EventTarget {
    constructor() {
        this[state] = new EventTargetState(this);
    }

    /** @internal */
    [state]: EventTargetState;

    addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean) {
        const that = this[state];
        const executor = new Executor(type, callback);
        executor.options.capture = typeof options === "boolean" ? options : !!options?.capture;

        if (!that[_executors].some(x => x.equals(executor))) {
            if (typeof options === "object") {
                const { once, passive, signal } = options;

                executor.options.once = !!once;
                executor.options.passive = !!passive;

                if (signal) {
                    executor.options.signal = signal;
                    reply(this, signal, executor);
                }
            }

            that[_executors].push(executor);

            const f = (v: Executor) => !!v.options.capture ? 0 : 1;
            that[_executors] = that[_executors].sort((a, b) => f(a) - f(b));
        }
    }

    dispatchEvent(event: Event): boolean {
        if (typeof event !== "object") {
            throw new TypeError("EventTarget.dispatchEvent: Argument 1 is not an object.");
        }

        if (!(event instanceof EventP)) {
            throw new TypeError("EventTarget.dispatchEvent: Argument 1 does not implement interface Event.");
        }

        Event_setTrusted(event, false);
        event[eventState].target = this;

        return EventTarget_fire(this, event);
    }

    removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean) {
        const that = this[state];
        const executor = new Executor(type, callback);
        executor.options.capture = typeof options === "boolean" ? options : !!options?.capture;

        if (that[_executors].some(x => x.equals(executor))) {
            that[_executors] = that[_executors].filter(x => !x.equals(executor));
        }
    }

    toString() { return "[object EventTarget]"; }
    get isPolyfill() { return { symbol: polyfill, hierarchy: ["EventTarget"] }; }
}

dfStringTag(EventTargetP, "EventTarget");

/** @internal */
const _executors = Symbol();

/** @internal */
export class EventTargetState {
    constructor(target: EventTarget) {
        this.target = target;
    }

    target: EventTarget;
    [_executors] = [] as Executor[];
}

/** @internal */
export function EventTarget_fire(target: EventTarget, event: Event) {
    const that = (target as EventTargetP)[state];
    const s = (event as EventP)[eventState];

    if (!event.target) s.target = target;
    s.currentTarget = target;
    s.eventPhase = EventP.AT_TARGET;
    Event_setEtField(event, dispatched, true);

    let onceIndexes: number[] = [];

    for (let i = 0; i < that[_executors].length; ++i) {
        if (Event_getEtField(event, stopImmediatePropagationCalled)) break;

        let executor = that[_executors][i]!;
        if (executor.type !== event.type) continue;
        if (executor.options.once) onceIndexes.push(i);

        Event_setEtField(event, passive, !!executor.options.passive);

        try {
            let { callback: cb } = executor;
            if (typeof cb === "function") cb.call(target, event);
        } catch (e) {
            console.error(e);
        }

        Event_setEtField(event, passive, false);
    }

    if (onceIndexes.length > 0) {
        that[_executors] = that[_executors].reduce((acc: Executor[], cur, index) => {
            if (onceIndexes.indexOf(index) === -1) acc.push(cur);
            return acc;
        }, []);
    }

    s.currentTarget = null;
    s.eventPhase = EventP.NONE;
    Event_setEtField(event, dispatched, false);

    return !(event.cancelable && Event_getEtField(event, preventDefaultCalled));
}

/** @internal */
export function EventTarget_count(target: EventTarget) {
    return (target as EventTargetP)[state][_executors].length;
}

function reply(target: EventTarget, signal: AbortSignal, executor: Executor) {
    const s = (target as EventTargetP)[state];
    const onAbort = () => {
        s[_executors] = s[_executors].filter(x => !x.equals(executor));
        signal.removeEventListener("abort", onAbort);
    }

    try {
        signal.addEventListener("abort", onAbort);
    } catch (e) {
        console.warn(e);
    }
}

/** @internal */
class Executor {
    constructor(type: string, callback: EventListenerOrEventListenerObject | null) {
        this.type = String(type);
        this.callback = extract(callback);
    }

    type: string;
    callback: EventListener | null;

    options: AddEventListenerOptions = {};

    equals(executor: Executor) {
        return Object.is(this.type, executor.type) && Object.is(this.callback, executor.callback)
            && Object.is(this.options.capture, executor.options.capture);
    }
}

function extract(cb: EventListenerOrEventListenerObject | null): EventListener | null {
    if (typeof cb === "function") {
        return cb;
    } else if (isEventListenerObject(cb)) {
        return cb.handleEvent;
    } else {
        return cb;
    }
}

function isEventListenerObject(cb: EventListenerObject | null): cb is EventListenerObject {
    return !!cb && "handleEvent" in cb && typeof cb.handleEvent === "function";
}

/** @internal */
export function attachFn(target: EventTarget, type: string, cb: Function | null, listener: EventListener) {
    if (typeof cb === "function") {
        target.addEventListener(type, listener);
    } else {
        target.removeEventListener(type, listener);
    }
}

/** @internal */
export function executeFn(target: EventTarget, cb: Function | null, ev: Event) {
    if (typeof cb === "function") cb.call(target, ev);
}

const EventTargetE = g["EventTarget"] || EventTargetP;
export { EventTargetE as EventTarget };
