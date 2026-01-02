import { g, polyfill, Class_setStringTag } from "./isPolyfill";
import { createAbortSignal, AbortSignal_abort } from "./AbortSignalP";

/** @internal */
const state = Symbol(/* "AbortControllerState" */);

/** @type {typeof globalThis.AbortController} */
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
    /** @internal */ get isPolyfill() { return { symbol: polyfill, hierarchy: ["AbortController"] }; }
}

Class_setStringTag(AbortControllerP, "AbortController");

/** @internal */
class AbortControllerState {
    signal = createAbortSignal();
}

const AbortControllerE = g["AbortController"] || AbortControllerP;
export { AbortControllerE as AbortController };
