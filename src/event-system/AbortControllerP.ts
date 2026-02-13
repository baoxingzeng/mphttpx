import { SymbolP, setState } from "../utils";
import { AbortSignal_abort, createAbortSignal } from "./AbortSignalP";

export class AbortControllerP implements AbortController {
    constructor() {
        setState(this, "__AbortController__", new AbortControllerState());
    }

    /** @internal */ declare readonly __AbortController__: AbortControllerState;

    get signal(): AbortSignal { return state(this).signal; }
    abort(reason?: any): void { AbortSignal_abort(this.signal, true, reason); }

    /** @internal */ toString() { return "[object AbortController]"; }
    /** @internal */ get [SymbolP.toStringTag]() { return "AbortController"; }
    /** @internal */ get __MPHTTPX__() { return { chain: ["AbortController"] }; }
}

/** @internal */
class AbortControllerState {
    signal = createAbortSignal();
}

function state(target: AbortControllerP) {
    return target.__AbortController__;
}

const AbortControllerE = (typeof AbortController !== "undefined" && AbortController) || AbortControllerP;
export { AbortControllerE as AbortController };
