import { g, polyfill, defineStringTag } from "./isPolyfill";
import { abortSignalState, createAbortSignalP, abort } from "./AbortSignalP";

const state = Symbol(/* "AbortControllerState" */);

export class AbortControllerP implements AbortController {
    constructor() {
        this[state] = new AbortControllerState();
    }

    [state]: AbortControllerState;

    get signal(): AbortSignal { return this[state].signal; }

    abort(reason?: any): void {
        abort.call(this[state].signal[abortSignalState], reason);
    }

    toString() { return "[object AbortController]"; }
    get isPolyfill() { return { symbol: polyfill, hierarchy: ["AbortController"] }; }
}

defineStringTag(AbortControllerP, "AbortController");

class AbortControllerState {
    signal = createAbortSignalP();
}

const AbortControllerE = g["AbortController"] || AbortControllerP;
export { AbortControllerE as AbortController };
