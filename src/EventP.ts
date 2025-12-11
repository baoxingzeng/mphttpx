import { g, polyfill, defineStringTag } from "./isPolyfill";

/** @internal */
const state = Symbol(/* "EventState" */);
export { state as eventState };

export class EventP implements Event {
    declare static readonly NONE: 0;
    declare static readonly CAPTURING_PHASE: 1;
    declare static readonly AT_TARGET: 2;
    declare static readonly BUBBLING_PHASE: 3;

    constructor(type: string, eventInitDict?: EventInit) {
        this[state] = new EventState();
        const that = this[state];

        that.type = String(type);
        that.bubbles = !!eventInitDict?.bubbles;
        that.cancelable = !!eventInitDict?.cancelable;
        that.composed = !!eventInitDict?.composed;

        Object.defineProperty(this, "isTrusted", {
            enumerable: true,
            get: (function isTrusted(this: EventP) { return this[state][_isTrusted]; }).bind(this),
        });
    }

    /** @internal */
    [state]: EventState;

    get type() { return this[state].type; }
    get bubbles() { return this[state].bubbles; }
    get cancelable() { return this[state].cancelable; }
    get composed() { return this[state].composed; }

    get target() { return this[state].target; }
    get currentTarget() { return this[state].currentTarget; }
    get eventPhase() { return this[state].eventPhase; }

    declare readonly NONE: 0;
    declare readonly CAPTURING_PHASE: 1;
    declare readonly AT_TARGET: 2;
    declare readonly BUBBLING_PHASE: 3;

    get srcElement() { return this[state].target; }
    get cancelBubble() { return this[state].cancelBubble; }
    set cancelBubble(value) { this[state].cancelBubble = value; }

    get defaultPrevented() { return this[state].defaultPrevented; }
    get returnValue() { return this[state].returnValue; }
    set returnValue(value) { if (!value) { this.preventDefault(); } }

    declare readonly isTrusted: boolean;
    get timeStamp() { return this[state].timeStamp; }

    composedPath(): EventTarget[] {
        let path = !!this.target ? [this.target] : [];
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

const properties = {
    NONE: { value: 0, enumerable: true },
    CAPTURING_PHASE: { value: 1, enumerable: true },
    AT_TARGET: { value: 2, enumerable: true },
    BUBBLING_PHASE: { value: 3, enumerable: true },
};

Object.defineProperties(EventP, properties);
Object.defineProperties(EventP.prototype, properties);

defineStringTag(EventP, "Event");

/** @internal */ const _TimeStamp = Symbol();

export /** @internal */ const _isTrusted = Symbol();

export /** @internal */ const _passive = Symbol();
export /** @internal */ const _dispatched = Symbol();
export /** @internal */ const _preventDefaultCalled = Symbol();
export /** @internal */ const _stopImmediatePropagationCalled = Symbol();

/** @internal */
class EventState {
    static [_TimeStamp] = (new Date()).getTime();

    type = "";
    bubbles = false;
    cancelable = false;
    composed = false;

    target = null as EventTarget | null;
    currentTarget = null as EventTarget | null;
    eventPhase: Event["eventPhase"] = EventP.NONE;

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
    let event = new EventP(type, eventInitDict);
    event[state].target = target;
    event[state][_isTrusted] = isTrusted;
    return event;
}

const EventE = g["EventTarget"] ? g["Event"] : EventP;
export { EventE as Event };
