import { emitEvent } from "../helpers/emitEvent";
import { attachFn, executeFn } from "../helpers/handlers";
import { EventTargetP, EventTargetState } from "./EventTargetP";
import { isSequence } from "../helpers/isSequence";
import { isEventTarget } from "../helpers/isEventTarget";
import { SymbolP, DOMExceptionP, setState, checkArgsLength } from "../utils";

export class AbortSignalP extends EventTargetP implements AbortSignal {
    static abort(reason?: any): AbortSignal {
        let signal = createAbortSignal(); AbortSignal_abort(signal, false, reason);
        return signal;
    }

    static any(signals: AbortSignal[]): AbortSignal {
        checkArgsLength(arguments.length, 1, "AbortSignal", "any");
        if (!isSequence(signals)) { throw new TypeError("Failed to execute 'any' on 'AbortSignal': The provided value cannot be converted to a sequence."); }

        let _signals = Array.isArray(signals) ? signals : Array.from<AbortSignal>(signals);
        _signals.forEach(sig => { if (!isEventTarget(sig)) throw new TypeError("Failed to execute 'any' on 'AbortSignal': Failed to convert value to 'AbortSignal'."); });

        let signal = createAbortSignal();
        let abortedSignal = (() => { for (let i = 0; i < _signals.length; ++i) { let sig = _signals[i]!; if (sig.aborted) return sig; } })();

        if (abortedSignal) {
            AbortSignal_abort(signal, false, abortedSignal.reason);
        } else {
            function abortFn(this: AbortSignal) {
                for (let i = 0; i < _signals.length; ++i) {
                    let sig = _signals[i]!;
                    sig.removeEventListener("abort", abortFn);
                }
                AbortSignal_abort(signal, true, this.reason);
            }

            for (let i = 0; i < _signals.length; ++i) {
                let sig = _signals[i]!;
                sig.addEventListener("abort", abortFn);
            }
        }

        return signal;
    }

    static timeout(milliseconds: number): AbortSignal {
        checkArgsLength(arguments.length, 1, "AbortSignal", "timeout");
        if (!(milliseconds >= 0)) {
            throw new TypeError("Failed to execute 'timeout' on 'AbortSignal': Value is outside the 'unsigned long long' value range.");
        }

        const signal = createAbortSignal();
        const execTimeout = () => AbortSignal_abort(signal, true, new DOMExceptionP("signal timed out", "TimeoutError"));

        setTimeout(execTimeout, milliseconds);
        return signal;
    }

    /** @internal */
    constructor() {
        if (new.target === AbortSignalP) {
            throw new TypeError("Failed to construct 'AbortSignal': Illegal constructor");
        }

        super();
        setState(this, "__AbortSignal__", new AbortSignalState(this));
    }

    /** @internal */ declare readonly __AbortSignal__: AbortSignalState;

    get aborted(): boolean { return state(this).aborted; }
    get reason(): any { return state(this).reason; }

    throwIfAborted(): void {
        if (this.aborted) { throw this.reason; }
    }

    get onabort() { return state(this).onabort; }
    set onabort(value) { state(this).onabort = value; state(this).attach("abort"); }

    /** @internal */ toString() { return "[object AbortSignal]"; }
    /** @internal */ get [SymbolP.toStringTag]() { return "AbortSignal"; }
    /** @internal */ get __MPHTTPX__() { return { chain: ["AbortSignal", "EventTarget"] }; }
}

/** @internal */
class AbortSignalState {
    constructor(target: AbortSignalP) {
        this.attach = attachFn<AbortSignal, "abort">(target, getHandlers(target));
    }

    aborted = false;
    reason: any = undefined;

    attach: (type: "abort") => void;
    onabort: ((this: AbortSignal, ev: Event) => any) | null = null;
}

function getHandlers(t: AbortSignal) {
    return {
        onabort: (ev: Event) => { executeFn(t, t.onabort, ev); },
    };
}

function state(target: AbortSignalP) {
    return target.__AbortSignal__;
}

/** @internal */
export function AbortSignal_abort(signal: AbortSignal, notify = true, reason?: any) {
    const s = state(signal as AbortSignalP);
    const execAbort = () => {
        s.aborted = true;
        s.reason = reason !== undefined ? reason : new DOMExceptionP("signal is aborted without reason", "AbortError");

        if (notify) emitEvent(signal, "abort");
    }

    if (!signal.aborted) execAbort();
}

/** @internal */
export function createAbortSignal(): AbortSignal {
    let signal = Object.create(AbortSignalP.prototype) as AbortSignalP;
    setState(signal, "__EventTarget__", new EventTargetState());
    setState(signal, "__AbortSignal__", new AbortSignalState(signal));
    return signal;
}

const AbortSignalE = (typeof AbortSignal !== "undefined" && AbortSignal) || AbortSignalP;
export { AbortSignalE as AbortSignal };
