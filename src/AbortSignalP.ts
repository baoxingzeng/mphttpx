import { createInnerEvent } from "./EventP";
import { g, polyfill, defineStringTag, MPException } from "./isPolyfill";
import { EventTargetP, EventTargetState, eventTargetState, fire, attachFn, executeFn } from "./EventTargetP";

/** @internal */
const state = Symbol(/* "AbortSignalState" */);
export { state as abortSignalState };

export class AbortSignalP extends EventTargetP implements AbortSignal {
    static abort(reason?: any): AbortSignal {
        let signal = createAbortSignalP();
        abort.call(signal[state], reason, false);

        return signal;
    }

    static any(signals: AbortSignal[]): AbortSignal {
        let signal = createAbortSignalP();
        let abortedSignal = signals.find(x => x.aborted);

        if (abortedSignal) {
            abort.call(signal[state], (abortedSignal as AbortSignalP).reason, false);
        } else {
            function abortFn(this: AbortSignal, ev: Event) {
                for (let sig of signals) {
                    sig.removeEventListener("abort", abortFn);
                }

                abort.call(signal[state], (this as AbortSignalP).reason, true, ev.isTrusted);
            }

            for (let sig of signals) {
                sig.addEventListener("abort", abortFn);
            }
        }

        return signal;
    }

    static timeout(milliseconds: number): AbortSignal {
        let signal = createAbortSignalP();

        setTimeout(() => {
            abort.call(signal[state], new MPException("signal timed out", "TimeoutError"));
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

defineStringTag(AbortSignalP, "AbortSignal");

/** @internal */
const _handlers = Symbol();

/** @internal */
export class AbortSignalState {
    constructor(target: AbortSignalP) {
        this.target = target;
    }

    target: AbortSignalP;

    aborted = false;
    reason: any = undefined;

    [_handlers] = getHandlers.call(this);
    onabort: ((this: AbortSignal, ev: Event) => any) | null = null;
}

export function abort(this: AbortSignalState, reason: any, notify = true, isTrusted = true) {
    if (!this.aborted) {
        this.aborted = true;
        this.reason = reason ?? (new MPException("signal is aborted without reason", "AbortError"));

        if (notify) {
            let evt = createInnerEvent(this.target, "abort", undefined, isTrusted);
            fire.call(this.target[eventTargetState], evt);
        }
    }
}

function getHandlers(this: AbortSignalState) {
    return {
        onabort: (ev: Event) => { executeFn.call(this.target, this.onabort, ev); },
    };
}

export function createAbortSignalP(): AbortSignalP {
    let instance: AbortSignalP = Object.create(AbortSignalP.prototype);
    instance[eventTargetState] = new EventTargetState(instance);
    instance[state] = new AbortSignalState(instance);
    return instance;
}

const AbortSignalE = g["AbortSignal"] || AbortSignalP;
export { AbortSignalE as AbortSignal };
