import { g, polyfill, dfStringTag } from "./isPolyfill";
import { EventP, type Event_EtFields, Event_getEtField } from "./EventP";

let dispatched: Event_EtFields["Dispatched"] = 1;

/** @internal */
const state = Symbol(/* "CustomEventState" */);

export class CustomEventP<T> extends EventP implements CustomEvent {
    constructor(type: string, eventInitDict?: CustomEventInit<T>) {
        super(type, eventInitDict);
        this[state] = new CustomEventState();
        this[state].detail = eventInitDict?.detail ?? null;
    }

    /** @internal */
    [state]: CustomEventState;

    get detail() { return this[state].detail as T; }

    initCustomEvent(type: string, bubbles?: boolean, cancelable?: boolean, detail?: T): void {
        if (Event_getEtField(this, dispatched)) return;

        this.initEvent(type, bubbles, cancelable);
        this[state].detail = detail ?? null;
    }

    toString() { return "[object CustomEvent]"; }
    get isPolyfill() { return { symbol: polyfill, hierarchy: ["CustomEvent", "Event"] }; }
}

dfStringTag(CustomEventP, "CustomEvent");

/** @internal */
class CustomEventState {
    detail: unknown;
}

const CustomEventE = g["EventTarget"] ? g["CustomEvent"] : CustomEventP;
export { CustomEventE as CustomEvent };
