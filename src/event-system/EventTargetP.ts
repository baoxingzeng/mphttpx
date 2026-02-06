import { EventP, Event_setTrusted } from "./EventP";
import { isEventTarget } from "../helpers/isEventTarget";
import { g, SymbolP, className, setState, checkArgsLength, isPolyfillType } from "../utils";

export class EventTargetP implements EventTarget, MPObject {
    constructor() {
        setState(this, "__EventTarget__", new EventTargetState());
    }

    /** @internal */ declare readonly __EventTarget__: EventTargetState;

    addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void {
        checkArgsLength(arguments.length, 2, className(this), "addEventListener");
        if (!(typeof callback === "function" || typeof callback === "object" || callback === undefined)) {
            throw new TypeError(`Failed to execute 'addEventListener' on '${className(this)}': parameter 2 is not of type 'Object'.`);
        }

        let executor = new Executor(type, callback);
        executor.options.capture = typeof options === "boolean" ? options : !!options?.capture;

        if (!state(this).executors.some(x => x.equals(executor))) {
            if (options && typeof options === "object") {
                executor.options.once = !!options.once;
                executor.options.passive = !!options.passive;

                const signal = options.signal; if (signal && isEventTarget(signal)) {
                    executor.options.signal = signal;
                    whenAbort(this, executor, signal);
                }
            }

            state(this).executors.push(executor);

            const f = (v: Executor) => !!v.options.capture ? 0 : 1;
            state(this).executors = state(this).executors.sort((a, b) => f(a) - f(b));
        }
    }

    dispatchEvent(event: Event): boolean {
        checkArgsLength(arguments.length, 1, className(this), "dispatchEvent");
        if (isPolyfillType<Event>("Event", event)) {
            Event_setTrusted(event, false);
        } else if (!isEvent(event)) {
            throw new TypeError(`Failed to execute 'dispatchEvent' on '${className(this)}': parameter 1 is not of type 'Event'.`);
        } else {
            console.warn(`WARNING: undefined behavior when executing 'dispatchEvent' on '${className(this)}': parameter 1 is not of type 'mphttpx.Event'`);
        }
        return EventTarget_fire(this, event);
    }

    removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean): void {
        checkArgsLength(arguments.length, 2, className(this), "removeEventListener");
        if (!(typeof callback === "function" || typeof callback === "object" || callback === undefined)) {
            throw new TypeError(`Failed to execute 'removeEventListener' on '${className(this)}': parameter 2 is not of type 'Object'.`);
        }

        let executor = new Executor(type, callback);
        executor.options.capture = typeof options === "boolean" ? options : !!options?.capture;

        if (state(this).executors.some(x => x.equals(executor))) {
            state(this).executors = state(this).executors.filter(x => !x.equals(executor));
        }
    }

    /** @internal */ toString() { return "[object EventTarget]"; }
    /** @internal */ get [SymbolP.toStringTag]() { return "EventTarget"; }
    /** @internal */ get __MPHTTPX__() { return { chain: ["EventTarget"] }; }
}

/** @internal */
export class EventTargetState {
    executors: Executor[] = [];
}

function state(target: EventTargetP) {
    return target.__EventTarget__;
}

function isEvent(value: unknown): value is Event {
    const predicate = (str: string) => {
        return "[object " === str.slice(0, 8) && str.slice(-6) === "Event]";
    }

    return !!value
        && typeof value === "object"
        && (predicate(Object.prototype.toString.call(value)) || predicate(String(value)))
        && "type" in value
        && typeof value.type === "string";
}

/** @internal */
export function EventTarget_fire(target: EventTarget, event: Event) {
    const s = state(target as EventTargetP);
    const evs = (event as EventP).__Event__ || {};

    evs.target = target;
    evs.currentTarget = target;
    evs.eventPhase = 2 /* AT_TARGET */;
    evs.eventDispatched = true;

    let onceIndexes: number[] = [];

    for (let i = 0; i < s.executors.length; ++i) {
        if (evs.immediatePropagationStopped) break;

        let executor = s.executors[i]!;
        if (executor.type !== event.type) continue;
        if (executor.options.once) onceIndexes.push(i);

        evs.passive = !!executor.options.passive;

        try {
            let cb = executor.callback;
            if (typeof cb === "function") cb.call(target, event);
        } catch (e) {
            console.error(e);
        }

        evs.passive = false;
    }

    if (onceIndexes.length > 0) {
        s.executors = s.executors.reduce((acc: Executor[], cur, index) => {
            if (onceIndexes.indexOf(index) === -1) acc.push(cur);
            return acc;
        }, []);
    }

    evs.currentTarget = null;
    evs.eventPhase = 0 /* NONE */;
    evs.eventDispatched = false;

    return !(event.cancelable && event.defaultPrevented);
}

function whenAbort(target: EventTargetP, executor: Executor, signal: AbortSignal) {
    const onAbort = () => {
        state(target).executors = state(target).executors.filter(x => !x.equals(executor));
        signal.removeEventListener("abort", onAbort);
    }
    signal.addEventListener("abort", onAbort);
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
        return Object.is(this.type, executor.type)
            && Object.is(this.callback, executor.callback)
            && Object.is(this.options.capture, executor.options.capture);
    }
}

function extract(cb: EventListenerOrEventListenerObject | null): EventListener | null {
    return typeof cb === "function" ? cb : isEventListenerObject(cb) ? cb.handleEvent : cb;
}

function isEventListenerObject(cb: EventListenerObject | null): cb is EventListenerObject {
    return !!cb && typeof cb === "object" && "handleEvent" in cb && typeof cb.handleEvent === "function";
}

const EventTargetE = g.EventTarget || EventTargetP;
export { EventTargetE as EventTarget };
