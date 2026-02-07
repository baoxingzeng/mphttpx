import { EventP } from "./EventP";
import { SymbolP, setState, checkArgsLength } from "../utils";

export class CustomEventP<T> extends EventP implements CustomEvent {
    constructor(type: string, eventInitDict?: CustomEventInit<T>) {
        super(type, eventInitDict);
        setState(this, "__CustomEvent__", new CustomEventState());
        state(this).detail = eventInitDict?.detail ?? null;
    }

    /** @internal */ declare readonly __CustomEvent__: CustomEventState;

    get detail() { return state(this).detail as T; }

    initCustomEvent(type: string, bubbles?: boolean, cancelable?: boolean, detail?: T): void {
        checkArgsLength(arguments.length, 1, "CustomEvent", "initCustomEvent");
        if (this.__Event__.eventDispatched) return;
        this.initEvent(type, bubbles, cancelable);
        state(this).detail = detail ?? null;
    }

    /** @internal */ toString() { return "[object CustomEvent]"; }
    /** @internal */ get [SymbolP.toStringTag]() { return "CustomEvent"; }
    /** @internal */ get __MPHTTPX__() { return { chain: ["CustomEvent", "Event"] }; }
}

/** @internal */
class CustomEventState {
    detail: unknown;
}

function state<T>(target: CustomEventP<T>) {
    return target.__CustomEvent__;
}

const CustomEventE = (typeof CustomEvent !== "undefined" && CustomEvent) || CustomEventP;
export { CustomEventE as CustomEvent };
