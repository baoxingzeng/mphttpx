import { EventP } from "./EventP";
import { g, SymbolP, setState } from "../utils";

export class CloseEventP extends EventP implements CloseEvent, MPObject {
    constructor(type: string, eventInitDict?: CloseEventInit) {
        super(type, eventInitDict);
        setState(this, "__CloseEvent__", new CloseEventState());
        const s = state(this);

        let _code = Number(eventInitDict?.code ?? 0);
        s.code = isNaN(_code) ? 0 : _code;
        if (eventInitDict?.reason !== undefined) s.reason = "" + eventInitDict.reason;
        s.wasClean = !!eventInitDict?.wasClean;
    }

    /** @internal */ declare readonly __CloseEvent__: CloseEventState;

    get code() { return state(this).code; }
    get reason() { return state(this).reason; }
    get wasClean() { return state(this).wasClean; }

    /** @internal */ toString() { return "[object CloseEvent]"; }
    /** @internal */ get [SymbolP.toStringTag]() { return "CloseEvent"; }
    /** @internal */ get __MPHTTPX__() { return { chain: ["CloseEvent", "Event"] }; }
}

/** @internal */
class CloseEventState {
    code = 0;
    reason = "";
    wasClean = false;
}

function state(target: CloseEventP) {
    return target.__CloseEvent__;
}

const CloseEventE = g["EventTarget"] ? g["CloseEvent"] : CloseEventP;
export { CloseEventE as CloseEvent };
