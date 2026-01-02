import { createInnerEvent } from "./EventP";
import { g, polyfill, Class_setStringTag, checkArgsLength, MPException, isPolyfillType } from "./isPolyfill";
import { EventTargetP, EventTargetState, eventTargetState, EventTarget_fire, attachFn, executeFn } from "./EventTargetP";

/** @internal */
const state = Symbol(/* "AbortSignalState" */);

/** @type {typeof globalThis.AbortSignal} */
export class AbortSignalP extends EventTargetP implements AbortSignal {
    static abort(reason?: any) {
        let signal = createAbortSignal();
        AbortSignal_abort(signal, reason, false);
        return signal;
    }

    static any(...args: [AbortSignal[]]) {
        const [signals] = args;
        checkArgsLength(args, 1,"AbortSignal", "any");
        if (!(Array.isArray(signals) || (signals && typeof signals === "object" && Symbol.iterator in signals))) {
            throw new TypeError("Failed to execute 'any' on 'AbortSignal': The provided value cannot be converted to a sequence.");
        }

        let _signals = Array.isArray(signals) ? signals : Array.from<AbortSignal>(signals as never);
        _signals.forEach(sig => {
            if (!isPolyfillType<EventTarget>("EventTarget", sig)) {
                throw new TypeError("Failed to execute 'any' on 'AbortSignal': Failed to convert value to 'AbortSignal'.");
            }
        });

        let signal = createAbortSignal();
        let abortedSignal = _signals.find(x => x.aborted);

        if (abortedSignal) {
            AbortSignal_abort(signal, (abortedSignal as AbortSignalP).reason, false);
        } else {
            function abortFn(this: AbortSignal, ev: Event) {
                for (let i = 0; i < _signals.length; ++i) {
                    let sig = _signals[i]!;
                    sig.removeEventListener("abort", abortFn);
                }
                AbortSignal_abort(signal, (this as AbortSignalP).reason, true, ev.isTrusted);
            }

            for (let i = 0; i < _signals.length; ++i) {
                let sig = _signals[i]!;
                sig.addEventListener("abort", abortFn);
            }
        }

        return signal;
    }

    static timeout(...args: [number]) {
        const [milliseconds] = args;
        checkArgsLength(args, 1, "AbortSignal", "timeout");
        if (!(milliseconds >= 0)) {
            throw new TypeError("Failed to execute 'timeout' on 'AbortSignal': Value is outside the 'unsigned long long' value range.");
        }

        let signal = createAbortSignal();
        setTimeout(() => {
            AbortSignal_abort(signal, new MPException("signal timed out", "TimeoutError"));
        }, milliseconds);
        return signal;
    }

    /** @internal */
    constructor() {
        if (new.target === AbortSignalP) {
            throw new TypeError("Failed to construct 'AbortSignal': Illegal constructor");
        }

        super();
        this[state] = new AbortSignalState(this);
    }

    /** @internal */
    [state]: AbortSignalState;

    get aborted() { return this[state].aborted; }
    get reason() { return this[state].reason; }

    throwIfAborted(): void {
        if (this.aborted) { throw this.reason; }
    }

    get onabort() { return this[state].onabort; }
    set onabort(value) {
        this[state].onabort = value;
        attachFn(this, "abort", value, this[state][_handlers].onabort);
    }

    /** @internal */ toString() { return "[object AbortSignal]"; }
    /** @internal */ get isPolyfill() { return { symbol: polyfill, hierarchy: ["AbortSignal", "EventTarget"] }; }
}

Class_setStringTag(AbortSignalP, "AbortSignal");

/** @internal */
const _handlers = Symbol();

/** @internal */
class AbortSignalState {
    constructor(target: AbortSignal) {
        this.target = target;
    }

    target: AbortSignal;

    aborted = false;
    reason: any = undefined;

    readonly [_handlers] = getHandlers(this);
    onabort: ((this: AbortSignal, ev: Event) => any) | null = null;
}

/** @internal */
export function AbortSignal_abort(signal: AbortSignal, reason: any, notify = true, isTrusted = true) {
    const s = (signal as AbortSignalP)[state];
    if (!s.aborted) {
        s.aborted = true;
        s.reason = reason ?? (new MPException("signal is aborted without reason", "AbortError"));

        if (notify) {
            let evt = createInnerEvent(signal, "abort", undefined, isTrusted);
            EventTarget_fire(signal, evt);
        }
    }
}

function getHandlers(s: AbortSignalState) {
    return {
        onabort: (ev: Event) => { executeFn(s.target, s.onabort, ev); },
    };
}

/** @internal */
export function createAbortSignal(): AbortSignal {
    let signal: AbortSignalP = Object.create(AbortSignalP.prototype);
    signal[eventTargetState] = new EventTargetState(signal);
    signal[state] = new AbortSignalState(signal);
    return signal;
}

const AbortSignalE = g["AbortSignal"] || AbortSignalP;
export { AbortSignalE as AbortSignal };
