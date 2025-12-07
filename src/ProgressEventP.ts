import { EventP } from "./EventP";
import { g, polyfill, defineStringTag } from "./isPolyfill";

const state = Symbol(/* "ProgressEventState" */);

export class ProgressEventP extends EventP implements ProgressEvent {
    constructor(type: string, eventInitDict?: ProgressEventInit) {
        super(type, eventInitDict);
        this[state] = new ProgressEventState();

        this[state].lengthComputable = !!eventInitDict?.lengthComputable;
        this[state].loaded = eventInitDict?.loaded ?? 0;
        this[state].total = eventInitDict?.total ?? 0;
    }

    [state]: ProgressEventState;

    get lengthComputable() { return this[state].lengthComputable; }
    get loaded() { return this[state].loaded; }
    get total() { return this[state].total; }

    toString() { return "[object ProgressEvent]"; }
    get isPolyfill() { return { symbol: polyfill, hierarchy: ["ProgressEvent", "Event"] }; }
}

defineStringTag(ProgressEventP, "ProgressEvent");

class ProgressEventState {
    lengthComputable = false;
    loaded = 0;
    total = 0;
}

const ProgressEventE = g["EventTarget"] ? g["ProgressEvent"] : ProgressEventP;
export { ProgressEventE as ProgressEvent };
