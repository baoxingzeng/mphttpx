import { g, polyfill } from "./isPolyfill";
import { createAbortSignal, AbortSignal_abort } from "./AbortSignalP";

/** @internal */
const state = Symbol(/* "AbortControllerState" */);

export class AbortControllerP implements AbortController {
    constructor() {
        this[state] = new AbortControllerState();
    }

    /** @internal */
    [state]: AbortControllerState;

    get signal() { return this[state].signal; }

    abort(reason?: any): void {
        AbortSignal_abort(this[state].signal, reason);
    }

    /** @internal */ toString() { return "[object AbortController]"; }
    /** @internal */ get [Symbol.toStringTag]() { return "AbortController"; }
    /** @internal */ get isPolyfill() { return { symbol: polyfill, hierarchy: ["AbortController"] }; }
}

/** @internal */
class AbortControllerState {
    signal = createAbortSignal();
}

const AbortControllerE = g["AbortController"] || AbortControllerP;
export { AbortControllerE as AbortController };
