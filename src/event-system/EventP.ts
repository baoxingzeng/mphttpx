import { SymbolP, className, setState, checkArgsLength } from "../utils";

export class EventP implements Event {
    static get NONE(): 0 { return 0; }
    static get CAPTURING_PHASE(): 1 { return 1; }
    static get AT_TARGET(): 2 { return 2; }
    static get BUBBLING_PHASE(): 3 { return 3; }

    constructor(type: string, eventInitDict?: EventInit) {
        checkArgsLength(arguments.length, 1, "Event");
        setState(this, "__Event__", new EventState());
        const s = state(this);

        s.type = "" + type;
        s.bubbles = !!eventInitDict?.bubbles;
        s.cancelable = !!eventInitDict?.cancelable;
        s.composed = !!eventInitDict?.composed;

        Object.defineProperty(this, "isTrusted", {
            enumerable: true,
            get: function isTrusted(): boolean { return s.isTrusted === "YES"; },
        });
    }

    /** @internal */ declare readonly __Event__: EventState;

    get NONE(): 0 { return 0; }
    get CAPTURING_PHASE(): 1 { return 1; }
    get AT_TARGET(): 2 { return 2; }
    get BUBBLING_PHASE(): 3 { return 3; }

    get bubbles(): boolean { return state(this).bubbles; }
    get cancelBubble(): boolean { return state(this).cancelBubble; }
    set cancelBubble(value: boolean) { if (value) { state(this).cancelBubble = true; } }
    get cancelable(): boolean { return state(this).cancelable; }
    get composed(): boolean { return state(this).composed; }
    get currentTarget(): EventTarget | null { return state(this).currentTarget; }
    get defaultPrevented(): boolean { return state(this).defaultPrevented; }
    get eventPhase(): number { return state(this).eventPhase; }
    declare readonly isTrusted: boolean;
    get returnValue(): boolean { return state(this).returnValue; }
    set returnValue(value: boolean) { if (!value) { this.preventDefault(); } }
    get srcElement(): EventTarget | null { return state(this).target; }
    get target(): EventTarget | null { return state(this).target; }
    get timeStamp(): DOMHighResTimeStamp { return state(this).timeStamp; }
    get type(): string { return state(this).type; }

    composedPath(): EventTarget[] {
        let path = this.target ? [this.target] : [];
        if (this.currentTarget && this.currentTarget !== this.target) path.push(this.currentTarget);
        return path;
    }

    initEvent(type: string, bubbles?: boolean, cancelable?: boolean): void {
        checkArgsLength(arguments.length, 1, className(this), "initEvent");
        let s = state(this);
        if (s.eventDispatched) return;
        s.type = "" + type;
        s.bubbles = !!bubbles;
        s.cancelable = !!cancelable;
    }

    preventDefault(): void {
        let s = state(this);
        if (s.passive) return console.warn(`Ignoring 'preventDefault()' call on event of type '${this.type}' from a listener registered as 'passive'.`);

        if (this.cancelable) {
            s.defaultPrevented = true;
            s.returnValue = false;
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
