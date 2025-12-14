import { createInnerEvent } from "./EventP";
import { g, polyfill, dfStringTag, MPException } from "./isPolyfill";
import { EventTargetP, EventTargetState, eventTargetState, EventTarget_fire, attachFn, executeFn } from "./EventTargetP";

/** @internal */
const state = Symbol(/* "AbortSignalState" */);

export class AbortSignalP extends EventTargetP implements AbortSignal {
    static abort(reason?: any) {
        let signal = createAbortSignal();
        AbortSignal_abort(signal, reason, false);

        return signal;
    }

    static any(signals: AbortSignal[]) {
        let signal = createAbortSignal();
        let abortedSignal = signals.find(x => x.aborted);

        if (abortedSignal) {
            AbortSignal_abort(signal, (abortedSignal as AbortSignalP).reason, false);
        } else {
            let _signals = Array.from(signals);
            function abortFn(this: AbortSignal, ev: Event) {
                for (let i = 0; i < _signals.length; ++i) {
                    let sig = _signals[i]!;
                    sig.removeEventListener("abort", abortFn);
                }

                AbortSignal_abort(signal, (this as AbortSignalP).reason, true, ev.isTrusted);
            }

            for (let i = 0; i < _signals.length; ++i) {
                let sig = _signals[1]!;
                sig.addEventListener("abort", abortFn);
            }
        }

        return signal;
    }

    static timeout(milliseconds: number) {
        let signal = createAbortSignal();

        setTimeout(() => {
            AbortSignal_abort(signal, new MPException("signal timed out", "TimeoutError"));
        }, milliseconds);

        return signal;
    }

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

    toString() { return "[object AbortSignal]"; }
    get isPolyfill() { return { symbol: polyfill, hierarchy: ["AbortSignal", "EventTarget"] }; }
}

dfStringTag(AbortSignalP, "AbortSignal");

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
