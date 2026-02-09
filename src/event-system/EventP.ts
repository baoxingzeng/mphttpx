import { SymbolP, className, setState, checkArgsLength } from "../utils";

export class EventP implements Event {
    static get NONE(): 0 { return 0; }
    static get CAPTURING_PHASE(): 1 { return 1; }
    static get AT_TARGET(): 2 { return 2; }
    static get BUBBLING_PHASE(): 3 { return 3; }

    constructor(type: string, eventInitDict?: EventInit) {
        checkArgsLength(arguments.length, 1, "Event");
        setState(this, "__Event__", new EventState());
        state(this).type = "" + type;
        state(this).bubbles = !!eventInitDict?.bubbles;
        state(this).cancelable = !!eventInitDict?.cancelable;
        state(this).composed = !!eventInitDict?.composed;

        Object.defineProperty(this, "isTrusted", {
            enumerable: true,
            get: (function isTrusted(this: EventP): boolean { return state(this).isTrusted === "YES"; }).bind(this),
        });
    }

    /** @internal */ declare readonly __Event__: EventState;

    get NONE(): 0 { return 0; }
    get CAPTURING_PHASE(): 1 { return 1; }
    get AT_TARGET(): 2 { return 2; }
    get BUBBLING_PHASE(): 3 { return 3; }

    get bubbles() { return state(this).bubbles; }
    get cancelBubble() { return state(this).cancelBubble; }
    set cancelBubble(value) { if (value) { state(this).cancelBubble = true; } }
    get cancelable() { return state(this).cancelable; }
    get composed() { return state(this).composed; }
    get currentTarget() { return state(this).currentTarget; }
    get defaultPrevented() { return state(this).defaultPrevented; }
    get eventPhase() { return state(this).eventPhase; }
    declare readonly isTrusted: boolean;
    get returnValue() { return state(this).returnValue; }
    set returnValue(value) { if (!value) { this.preventDefault(); } }
    get srcElement() { return state(this).target; }
    get target() { return state(this).target; }
    get timeStamp() { return state(this).timeStamp; }
    get type() { return state(this).type; }

    composedPath(): EventTarget[] {
        let path = this.target ? [this.target] : [];
        if (this.currentTarget && this.currentTarget !== this.target) path.push(this.currentTarget);
        return path;
    }

    initEvent(type: string, bubbles?: boolean, cancelable?: boolean): void {
        checkArgsLength(arguments.length, 1, className(this), "initEvent");
        if (state(this).eventDispatched) return;
        state(this).type = "" + type;
        state(this).bubbles = !!bubbles;
        state(this).cancelable = !!cancelable;
    }

    preventDefault(): void {
        if (state(this).passive) {
            return console.warn(`Ignoring 'preventDefault()' call on event of type '${this.type}' from a listener registered as 'passive'.`);
        }

        if (this.cancelable) {
            state(this).defaultPrevented = true;
            state(this).returnValue = false;
        }
    }

    stopImmediatePropagation(): void {
        state(this).immediatePropagationStopped = true;
        this.cancelBubble = true;
    }

    stopPropagation(): void {
        this.cancelBubble = true;
    }

    /** @internal */ toString() { return "[object Event]"; }
    /** @internal */ get [SymbolP.toStringTag]() { return "Event"; }
    /** @internal */ get __MPHTTPX__() { return { chain: ["Event"] }; }
}

/** @internal */
class EventState {
    constructor() {
        Object.defineProperty(this, "isTrusted", createTrustedPropertyDescriptor());
    }

    bubbles = false;
    cancelBubble = false;
    cancelable = false;
    composed = false;
    currentTarget: EventTarget | null = null;
    defaultPrevented = false;
    eventPhase = 0 /* NONE */;
    declare isTrusted: string;
    returnValue = true;
    target: EventTarget | null = null;
    timeStamp = (new Date()).getTime() - timeStamp;
    type = "";
    passive = false;
    eventDispatched = false;
    immediatePropagationStopped = false;
}

const timeStamp = (new Date()).getTime();

/** @internal */
export function state(target: EventP) {
    return target.__Event__;
}

function createTrustedPropertyDescriptor(): PropertyDescriptor {
    let name = createTrustedPropertyDescriptor.name;
    let idx = name.length;
    let isTrusted = "NO";
    return {
        configurable: false,
        enumerable: true,
        get: function () { return isTrusted; },
        set: function (value: string) { if (name === value.slice(0, idx)) { isTrusted = value.slice(idx + 1); } },
    };
}

/** @internal */
export function Event_setTrusted(event: Event, isTrusted: boolean) {
    state(event as EventP).isTrusted = `${createTrustedPropertyDescriptor.name}:${isTrusted ? "YES" : "NO"}`;
}

const EventE = (typeof Event !== "undefined" && Event) || EventP;
export { EventE as Event };
