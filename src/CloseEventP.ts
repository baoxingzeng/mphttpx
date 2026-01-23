import { EventP } from "./EventP";
import { g, polyfill } from "./isPolyfill";

/** @internal */
const state = Symbol(/* "CloseEventState" */);

export class CloseEventP extends EventP implements CloseEvent {
    constructor(type: string, eventInitDict?: CloseEventInit) {
        super(type, eventInitDict);
        this[state] = new CloseEventState();
        const s = this[state];

        let _code = Number(eventInitDict?.code ?? 0);
        s.code = isNaN(_code) ? 0 : _code;
        if (eventInitDict?.reason !== undefined) s.reason = "" + eventInitDict.reason;
        s.wasClean = !!eventInitDict?.wasClean;
    }

    /** @internal */
    [state]: CloseEventState;

    get code() { return this[state].code; }
    get reason() { return this[state].reason; }
    get wasClean() { return this[state].wasClean; }

    /** @internal */ toString() { return "[object CloseEvent]"; }
    /** @internal */ get [Symbol.toStringTag]() { return "CloseEvent"; }
    /** @internal */ get isPolyfill() { return { symbol: polyfill, hierarchy: ["CloseEvent", "Event"] }; }
}

/** @internal */
class CloseEventState {
    code = 0;
    reason = "";
    wasClean = false;
}

const CloseEventE = g["EventTarget"] ? g["CloseEvent"] : CloseEventP;
export { CloseEventE as CloseEvent };
