import { EventP } from "./EventP";
import { g, polyfill, Class_setStringTag } from "./isPolyfill";

/** @internal */
const state = Symbol(/* "CloseEventState" */);

export class CloseEventP extends EventP implements CloseEvent {
    constructor(type: string, eventInitDict?: CloseEventInit) {
        super(type, eventInitDict);
        this[state] = new CloseEventState();

        let _code = Number(eventInitDict?.code ?? 0);
        this[state].code = isNaN(_code) ? 0 : _code;
        if (eventInitDict?.reason !== undefined) this[state].reason = "" + eventInitDict.reason;
        this[state].wasClean = !!eventInitDict?.wasClean;
    }

    /** @internal */
    [state]: CloseEventState;

    get code() { return this[state].code; }
    get reason() { return this[state].reason; }
    get wasClean() { return this[state].wasClean; }

    /** @internal */ toString() { return "[object CloseEvent]"; }
    /** @internal */ get isPolyfill() { return { symbol: polyfill, hierarchy: ["CloseEvent", "Event"] }; }
}

Class_setStringTag(CloseEventP, "CloseEvent");

/** @internal */
class CloseEventState {
    code = 0;
    reason = "";
    wasClean = false;
}

const CloseEventE = g["EventTarget"] ? g["CloseEvent"] : CloseEventP;
export { CloseEventE as CloseEvent };
