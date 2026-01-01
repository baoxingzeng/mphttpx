import { type Event_EtFields } from "./EventP";
import { Event_getEtField, Event_setEtField } from "./EventP";
import { EventP, eventState, Event_setTrusted } from "./EventP";
import { g, polyfill, Class_setStringTag, checkArgs } from "./isPolyfill";

const passive: Event_EtFields["Passive"] = 0;
const dispatched: Event_EtFields["Dispatched"] = 1;
const preventDefaultCalled: Event_EtFields["PreventDefaultCalled"] = 2;
const stopImmediatePropagationCalled: Event_EtFields["StopImmediatePropagationCalled"] = 3;

/** @internal */ const state = Symbol(/* "EventTargetState" */);
/** @internal */ export { state as eventTargetState };

export class EventTargetP implements EventTarget {
    constructor() {
        this[state] = new EventTargetState(this);
        this[state].name = new.target.name;
    }

    /** @internal */
    [state]: EventTargetState;

    addEventListener(...args: [string, EventListenerOrEventListenerObject | null, (AddEventListenerOptions | boolean)?]) {
        const [type, callback, options] = args;
        checkArgs(args, this[state].name, "addEventListener", 2);
        if (typeof callback !== "function" && typeof callback !== "object" && typeof callback !== "undefined") {
            throw new TypeError(`Failed to execute 'addEventListener' on '${this[state].name}': parameter 2 is not of type 'Object'.`);
        }

        const s = this[state];
        const executor = new Executor(type, callback);
        executor.options.capture = typeof options === "boolean" ? options : !!options?.capture;

        if (!s[_executors].some(x => x.equals(executor))) {
            if (options && typeof options === "object") {
                const { once, passive, signal } = options;

                executor.options.once = !!once;
                executor.options.passive = !!passive;

                if (signal) {
                    executor.options.signal = signal;
                    reply(this, signal, executor);
                }
            }

            s[_executors].push(executor);

            const f = (v: Executor) => !!v.options.capture ? 0 : 1;
            s[_executors] = s[_executors].sort((a, b) => f(a) - f(b));
        }
    }

    dispatchEvent(...args: [Event]): boolean {
        const [event] = args;
        checkArgs(args, this[state].name, "dispatchEvent", 1);
        if (!(event instanceof EventP)) {
            throw new TypeError(`${this[state].name}.dispatchEvent: Argument 1 does not implement interface Event.`);
        }

        Event_setTrusted(event, false);
        event[eventState].target = this;
        return EventTarget_fire(this, event);
    }

    removeEventListener(...args: [string, EventListenerOrEventListenerObject | null, (EventListenerOptions | boolean)?]) {
        const [type, callback, options] = args;
        checkArgs(args, this[state].name, "removeEventListener", 2);
        if (typeof callback !== "function" && typeof callback !== "object" && typeof callback !== "undefined") {
            throw new TypeError(`Failed to execute 'removeEventListener' on '${this[state].name}': parameter 2 is not of type 'Object'.`);
        }

        const s = this[state];
        const executor = new Executor(type, callback);
        executor.options.capture = typeof options === "boolean" ? options : !!options?.capture;

        if (s[_executors].some(x => x.equals(executor))) {
            s[_executors] = s[_executors].filter(x => !x.equals(executor));
        }
    }

    /** @internal */ toString() { return "[object EventTarget]"; }
    /** @internal */ get isPolyfill() { return { symbol: polyfill, hierarchy: ["EventTarget"] }; }
}

Class_setStringTag(EventTargetP, "EventTarget");

/** @internal */
const _executors = Symbol();

/** @internal */
export class EventTargetState {
    constructor(target: EventTarget) {
        this.target = target;
    }

    target: EventTarget;
    name = "EventTarget";
    [_executors] = [] as Executor[];
}

/** @internal */
export function EventTarget_fire(target: EventTarget, event: Event) {
    const s = (target as EventTargetP)[state];
    const evs = (event as EventP)[eventState];

    if (!event.target) evs.target = target;
    evs.currentTarget = target;
    evs.eventPhase = EventP.AT_TARGET;
    Event_setEtField(event, dispatched, true);

    let onceIndexes: number[] = [];

    for (let i = 0; i < s[_executors].length; ++i) {
        if (Event_getEtField(event, stopImmediatePropagationCalled)) break;

        let executor = s[_executors][i]!;
        if (executor.type !== event.type) continue;
        if (executor.options.once) onceIndexes.push(i);

        Event_setEtField(event, passive, !!executor.options.passive);

        try {
            let cb = executor.callback;
            if (typeof cb === "function") cb.call(target, event);
        } catch (e) {
            console.error(e);
        }

        Event_setEtField(event, passive, false);
    }

    if (onceIndexes.length > 0) {
        s[_executors] = s[_executors].reduce((acc: Executor[], cur, index) => {
            if (onceIndexes.indexOf(index) === -1) acc.push(cur);
            return acc;
        }, []);
    }

    evs.currentTarget = null;
    evs.eventPhase = EventP.NONE;
    Event_setEtField(event, dispatched, false);

    return !(event.cancelable && Event_getEtField(event, preventDefaultCalled));
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
        this.type = "" + type;
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
