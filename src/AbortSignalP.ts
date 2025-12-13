import { createInnerEvent } from "./EventP";
import { g, polyfill, dfStringTag, MPException } from "./isPolyfill";
import { EventTargetP, EventTargetState, eventTargetState, EventTarget_fire, attachFn, executeFn } from "./EventTargetP";

/** @internal */
const state = Symbol(/* "AbortSignalState" */);

export class AbortSignalP extends EventTargetP implements AbortSignal {
    static abort(reason?: any): AbortSignal {
        let signal = createAbortSignalP();
        AbortSignal_abort(signal, reason, false);

        return signal;
    }

    static any(signals: AbortSignal[]): AbortSignal {
        let signal = createAbortSignalP();
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

    static timeout(milliseconds: number): AbortSignal {
        let signal = createAbortSignalP();

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
        attachFn.call(this, "abort", value, this[state][_handlers].onabort);
    }

    toString() { return "[object AbortSignal]"; }
    get isPolyfill() { return { symbol: polyfill, hierarchy: ["AbortSignal", "EventTarget"] }; }
}

dfStringTag(AbortSignalP, "AbortSignal");

/** @internal */
const _handlers = Symbol();

/** @internal */
class AbortSignalState {
    constructor(target: AbortSignalP) {
        this.target = target;
    }

    target: AbortSignalP;

    aborted = false;
    reason: any = undefined;

    [_handlers] = getHandlers.call(this);
    onabort: ((this: AbortSignal, ev: Event) => any) | null = null;
}

/** @internal */
export function AbortSignal_abort(signal: AbortSignalP, reason: any, notify = true, isTrusted = true) {
    const that = signal[state];
    if (!that.aborted) {
        that.aborted = true;
        that.reason = reason ?? (new MPException("signal is aborted without reason", "AbortError"));

        if (notify) {
            let evt = createInnerEvent(signal, "abort", undefined, isTrusted);
            EventTarget_fire(signal, evt);
        }
    }
}

function getHandlers(this: AbortSignalState) {
    return {
        onabort: (ev: Event) => { executeFn.call(this.target, this.onabort, ev); },
    };
}

/** @internal */
export function createAbortSignalP(): AbortSignalP {
    let instance: AbortSignalP = Object.create(AbortSignalP.prototype);
    instance[eventTargetState] = new EventTargetState(instance);
    instance[state] = new AbortSignalState(instance);
    return instance;
}

const AbortSignalE = g["AbortSignal"] || AbortSignalP;
export { AbortSignalE as AbortSignal };
