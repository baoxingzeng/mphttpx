import { g, polyfill, defineStringTag } from "./isPolyfill";

const state = Symbol(/* "EventState" */);
export { state as eventState };

export class EventP implements Event {
    static readonly NONE = 0;
    static readonly CAPTURING_PHASE = 1;
    static readonly AT_TARGET = 2;
    static readonly BUBBLING_PHASE = 3;

    constructor(type: string, eventInitDict?: EventInit) {
        this[state] = new EventState();

        this[state].type = String(type);
        this[state].bubbles = !!eventInitDict?.bubbles;
        this[state].cancelable = !!eventInitDict?.cancelable;
        this[state].composed = !!eventInitDict?.composed;
    }

    [state]: EventState;

    get type() { return this[state].type; }
    get bubbles() { return this[state].bubbles; }
    get cancelable() { return this[state].cancelable; }
    get composed() { return this[state].composed; }

    get target() { return this[state].target; }
    get currentTarget() { return this[state].currentTarget; }
    get eventPhase() { return this[state].eventPhase; }

    readonly NONE = EventP.NONE;
    readonly CAPTURING_PHASE = EventP.CAPTURING_PHASE;
    readonly AT_TARGET = EventP.AT_TARGET;
    readonly BUBBLING_PHASE = EventP.BUBBLING_PHASE;

    get srcElement() { return this[state].target; }
    cancelBubble = false;

    get defaultPrevented() { return this[state].defaultPrevented; }
    get returnValue() { return this[state].returnValue; }
    set returnValue(value) { if (!value) { this.preventDefault(); } }

    get isTrusted() { return this[state].isTrusted; }
    get timeStamp() { return this[state].timeStamp; }

    composedPath(): EventTarget[] {
        const path = !!this.target ? [this.target] : [];
        if (!!this.currentTarget && this.currentTarget !== this.target) path.push(this.currentTarget);

        return path;
    }

    initEvent = (type: string, bubbles?: boolean, cancelable?: boolean) => {
        if (this[state][_dispatched]) return;

        this[state].type = String(type);
        this[state].bubbles = !!bubbles;
        this[state].cancelable = !!cancelable;
    }

    preventDefault = () => {
        if (this[state][_passive]) {
            console.warn(`Ignoring 'preventDefault()' call on event of type '${this.type}' from a listener registered as 'passive'.`);
            return;
        }

        if (this.cancelable) {
            this[state][_preventDefaultCalled] = true;
            this[state].defaultPrevented = true;
            this[state].returnValue = false;
        }
    }

    stopImmediatePropagation = () => {
        this[state][_stopImmediatePropagationCalled] = true;
        this.cancelBubble = true;
    }

    stopPropagation(): void {
        this.cancelBubble = true;
    }

    toString() { return "[object Event]"; }
    get isPolyfill() { return { symbol: polyfill, hierarchy: ["Event"] }; }
}

defineStringTag(EventP, "Event");

const _TimeStamp = Symbol();

export const _passive = Symbol();
export const _dispatched = Symbol();
export const _preventDefaultCalled = Symbol();
export const _stopImmediatePropagationCalled = Symbol();

class EventState {
    static [_TimeStamp] = (new Date()).getTime();

    type = "";
    bubbles = false;
    cancelable = false;
    composed = false;

    target = null as EventTarget | null;
    currentTarget = null as EventTarget | null;
    eventPhase = EventP.NONE;

    defaultPrevented = false;
    returnValue = true;

    isTrusted = false;
    timeStamp = (new Date()).getTime() - EventState[_TimeStamp];

    [_passive] = false;
    [_dispatched] = false;
    [_preventDefaultCalled] = false;
    [_stopImmediatePropagationCalled] = false;
}

const EventE = g["EventTarget"] ? g["Event"] : EventP;
export { EventE as Event };
