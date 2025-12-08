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
        const that = this[state];

        that.type = String(type);
        that.bubbles = !!eventInitDict?.bubbles;
        that.cancelable = !!eventInitDict?.cancelable;
        that.composed = !!eventInitDict?.composed;
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
    get cancelBubble() { return this[state].cancelBubble; }
    set cancelBubble(value) { this[state].cancelBubble = value; }

    get defaultPrevented() { return this[state].defaultPrevented; }
    get returnValue() { return this[state].returnValue; }
    set returnValue(value) { if (!value) { this.preventDefault(); } }

    get isTrusted() { return this[state][_isTrusted]; }
    get timeStamp() { return this[state].timeStamp; }

    composedPath(): EventTarget[] {
        const path = !!this.target ? [this.target] : [];
        if (!!this.currentTarget && this.currentTarget !== this.target) path.push(this.currentTarget);

        return path;
    }

    initEvent(type: string, bubbles?: boolean, cancelable?: boolean){
        const that = this[state];
        if (that[_dispatched]) return;

        that.type = String(type);
        that.bubbles = !!bubbles;
        that.cancelable = !!cancelable;
    }

    preventDefault() {
        const that = this[state];

        if (that[_passive]) {
            console.warn(`Ignoring 'preventDefault()' call on event of type '${this.type}' from a listener registered as 'passive'.`);
            return;
        }

        if (this.cancelable) {
            that[_preventDefaultCalled] = true;
            that.defaultPrevented = true;
            that.returnValue = false;
        }
    }

    stopImmediatePropagation() {
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

export const _isTrusted = Symbol();

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

    cancelBubble = false;

    defaultPrevented = false;
    returnValue = true;

    timeStamp = (new Date()).getTime() - EventState[_TimeStamp];

    [_isTrusted] = false;

    [_passive] = false;
    [_dispatched] = false;
    [_preventDefaultCalled] = false;
    [_stopImmediatePropagationCalled] = false;
}

export function createInnerEvent(target: EventTarget, type: string, eventInitDict?: EventInit, isTrusted = true) {
    const event = new EventP(type, eventInitDict);
    event[state].target = target;
    event[state][_isTrusted] = isTrusted;
    return event;
}

const EventE = g["EventTarget"] ? g["Event"] : EventP;
export { EventE as Event };
