import { EventP } from "./EventP";
import { g, state, polyfill, defineStringTag, MPException } from "./isPolyfill";
import { EventTargetP, EventTargetState, eventTargetState, attachFn, executeFn } from "./EventTargetP";

export class AbortSignalP extends EventTargetP implements AbortSignal {
    static abort(reason?: any): AbortSignal {
        const signal = createAbortSignalP();
        signal[state].abort(reason, false);

        return signal;
    }

    static any(signals: AbortSignal[]): AbortSignal {
        const signal = createAbortSignalP();
        const abortedSignal = signals.find(x => x.aborted);

        if (abortedSignal) {
            signal[state].abort((abortedSignal as AbortSignalP).reason, false);
        } else {
            function abortFn(this: AbortSignal, ev: Event) {
                for (const sig of signals) {
                    sig.removeEventListener("abort", abortFn);
                }

                signal[state].abort((this as AbortSignalP).reason, true, ev.isTrusted);
            }

            for (const sig of signals) {
                sig.addEventListener("abort", abortFn);
            }
        }

        return signal;
    }

    static timeout(milliseconds: number): AbortSignal {
        const signal = createAbortSignalP();

        setTimeout(() => {
            signal[state].abort(new MPException("signal timed out", "TimeoutError"));
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

    [state]: AbortSignalState;

    get aborted() { return this[state].aborted; }
    get reason() { return this[state].reason; }

    throwIfAborted(): void {
        if (this.aborted) { throw this.reason; }
    }

    get onabort() { return this[state].onabort; }
    set onabort(value) {
        this[state].onabort = value;
        attachFn.call(this, "abort", value, this[state]._onabort);
    }

    toString() { return "[object AbortSignal]"; }
    get isPolyfill() { return { symbol: polyfill, hierarchy: ["AbortSignal", "EventTarget"] }; }
}

defineStringTag(AbortSignalP, "AbortSignal");

export class AbortSignalState {
    constructor(target: AbortSignalP) {
        this.target = target;
    }

    target: AbortSignalP;

    aborted = false;
    reason: any = undefined;

    abort(reason: any, notify = true, isTrusted = true) {
        if (!this.aborted) {
            this.aborted = true;
            this.reason = reason ?? (new MPException("signal is aborted without reason", "AbortError"));

            if (notify) {
                const evt = new EventP("abort");
                evt[state].target = this.target;
                evt[state].isTrusted = isTrusted;

                this.target[eventTargetState].fire(evt);
            }
        }
    }

    onabort: ((this: AbortSignal, ev: Event) => any) | null = null;
    _onabort = (ev: Event) => { executeFn.call(this.target, this.onabort, ev); }
}

export function createAbortSignalP(): AbortSignalP {
    const instance: AbortSignalP = Object.create(AbortSignalP.prototype);
    instance[eventTargetState] = new EventTargetState(instance);
    instance[state] = new AbortSignalState(instance);
    return instance;
}

const AbortSignalE = g["AbortSignal"] || AbortSignalP;
export { AbortSignalE as AbortSignal };
