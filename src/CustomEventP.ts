import { type Event_EtFields } from "./EventP";
import { EventP, Event_getEtField } from "./EventP";
import { g, polyfill, Class_setStringTag, checkArgs } from "./isPolyfill";

const dispatched: Event_EtFields["Dispatched"] = 1;

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

    initCustomEvent(...args: [string, boolean?, boolean?, T?]): void {
        const [type, bubbles, cancelable, detail] = args;
        checkArgs(args, "CustomEvent", "initCustomEvent", 1);
        if (Event_getEtField(this, dispatched)) return;

        this.initEvent(type, bubbles, cancelable);
        this[state].detail = detail ?? null;
    }

    /** @internal */ toString() { return "[object CustomEvent]"; }
    /** @internal */ get isPolyfill() { return { symbol: polyfill, hierarchy: ["CustomEvent", "Event"] }; }
}

Class_setStringTag(CustomEventP, "CustomEvent");

/** @internal */
class CustomEventState {
    detail: unknown;
}

const CustomEventE = g["EventTarget"] ? g["CustomEvent"] : CustomEventP;
export { CustomEventE as CustomEvent };
