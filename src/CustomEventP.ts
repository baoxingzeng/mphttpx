import { EventP, eventState, _dispatched } from "./EventP";
import { g, polyfill, defineStringTag } from "./isPolyfill";

const state = Symbol(/* "CustomEventState" */);

export class CustomEventP<T> extends EventP implements CustomEvent {
    constructor(type: string, eventInitDict?: CustomEventInit<T>) {
        super(type, eventInitDict);
        this[state] = new CustomEventState();
        this[state].detail = eventInitDict?.detail ?? null;
    }

    [state]: CustomEventState;
    get detail() { return this[state].detail as T; }

    initCustomEvent(type: string, bubbles?: boolean, cancelable?: boolean, detail?: T): void {
        if (this[eventState][_dispatched]) return;

        this.initEvent(type, bubbles, cancelable);
        this[state].detail = detail ?? null;
    }

    toString() { return "[object CustomEvent]"; }
    get isPolyfill() { return { symbol: polyfill, hierarchy: ["CustomEvent", "Event"] }; }
}

defineStringTag(CustomEventP, "CustomEvent");

class CustomEventState {
    detail: unknown;
}

const CustomEventE = g["EventTarget"] ? g["CustomEvent"] : CustomEventP;
export { CustomEventE as CustomEvent };
