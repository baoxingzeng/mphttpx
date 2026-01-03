import { g, polyfill, Class_setStringTag, checkArgsLength } from "./isPolyfill";

/** @internal */ const state = Symbol(/* "EventState" */);
/** @internal */ export { state as eventState };

export class EventP implements Event {
    declare static readonly NONE: 0;
    declare static readonly CAPTURING_PHASE: 1;
    declare static readonly AT_TARGET: 2;
    declare static readonly BUBBLING_PHASE: 3;

    constructor(...args: [string, EventInit?]) {
        const [type, eventInitDict] = args;
        checkArgsLength(args, 1, new.target.name);

        this[state] = new EventState();
        const s = this[state];

        s.type = "" + type;
        s.bubbles = !!eventInitDict?.bubbles;
        s.cancelable = !!eventInitDict?.cancelable;
        s.composed = !!eventInitDict?.composed;

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
    set cancelBubble(value) { this[state].cancelBubble = !!value; }

    get defaultPrevented() { return this[state].defaultPrevented; }
    get returnValue() { return this[state].returnValue; }
    set returnValue(value) { if (!value) { this.preventDefault(); } }

    declare readonly isTrusted: boolean;
    get timeStamp() { return this[state].timeStamp; }

    composedPath() {
        let path = !!this.target ? [this.target] : [];
        if (!!this.currentTarget && this.currentTarget !== this.target) path.push(this.currentTarget);
        return path;
    }

    initEvent(...args: [string, boolean?, boolean?]){
        const [type, bubbles, cancelable] = args;
        checkArgsLength(args, 1, "Event", "initEvent");
        const s = this[state];
        if (s[_dispatched]) return;
        s.type = "" + type;
        s.bubbles = !!bubbles;
        s.cancelable = !!cancelable;
    }

    preventDefault() {
        const s = this[state];

        if (s[_passive]) {
            console.warn(`Ignoring 'preventDefault()' call on event of type '${this.type}' from a listener registered as 'passive'.`);
            return;
        }

        if (this.cancelable) {
            s[_preventDefaultCalled] = true;
            s.defaultPrevented = true;
            s.returnValue = false;
        }
    }

    stopImmediatePropagation() {
        this[state][_stopImmediatePropagationCalled] = true;
        this.cancelBubble = true;
    }

    stopPropagation(): void {
        this.cancelBubble = true;
    }

    /** @internal */ toString() { return "[object Event]"; }
    /** @internal */ get isPolyfill() { return { symbol: polyfill, hierarchy: ["Event"] }; }
}

const properties = {
    NONE: { value: 0, enumerable: true },
    CAPTURING_PHASE: { value: 1, enumerable: true },
    AT_TARGET: { value: 2, enumerable: true },
    BUBBLING_PHASE: { value: 3, enumerable: true },
};

Object.defineProperties(EventP, properties);
Object.defineProperties(EventP.prototype, properties);

Class_setStringTag(EventP, "Event");

/** @internal */ const _timeStamp = (new Date()).getTime();
/** @internal */ const _isTrusted = Symbol();

/** @internal */ const _passive = Symbol();
/** @internal */ const _dispatched = Symbol();
/** @internal */ const _preventDefaultCalled = Symbol();
/** @internal */ const _stopImmediatePropagationCalled = Symbol();

/** @internal */
class EventState {
    type = "";
    bubbles = false;
    cancelable = false;
    composed = false;

    target: EventTarget | null = null;
    currentTarget: EventTarget | null = null;
    eventPhase: Event["eventPhase"] = EventP.NONE;

    cancelBubble = false;

    defaultPrevented = false;
    returnValue = true;

    timeStamp = (new Date()).getTime() - _timeStamp;

    [_isTrusted] = false;

    [_passive] = false;
    [_dispatched] = false;
    [_preventDefaultCalled] = false;
    [_stopImmediatePropagationCalled] = false;
}

/** @internal */
export function Event_setTrusted(event: Event, isTrusted: boolean) {
    Object.defineProperty((event as EventP)[state], _isTrusted, {
        value: isTrusted,
        writable: true,
        enumerable: true,
        configurable: true,
    });
}

/** @internal */
export type Event_EtFields = {
    Passive: 0;
    Dispatched: 1;
    PreventDefaultCalled: 2;
    StopImmediatePropagationCalled: 3;
};

const passive: Event_EtFields["Passive"] = 0;
const dispatched: Event_EtFields["Dispatched"] = 1;
const preventDefaultCalled: Event_EtFields["PreventDefaultCalled"] = 2;
const stopImmediatePropagationCalled: Event_EtFields["StopImmediatePropagationCalled"] = 3;

/** @internal */
export function Event_getEtField(event: Event, field: Event_EtFields[keyof Event_EtFields]) {
    const s = (event as EventP)[state];
    switch (field) {
        case passive:
            return s[_passive];
        case dispatched:
            return s[_dispatched];
        case preventDefaultCalled:
            return s[_preventDefaultCalled];
        case stopImmediatePropagationCalled:
            return s[_stopImmediatePropagationCalled];
    }
}

/** @internal */
export function Event_setEtField(event: Event, field: Event_EtFields[keyof Event_EtFields], value: boolean) {
    const s = (event as EventP)[state];
    switch (field) {
        case passive: 
            s[_passive] = value;
            break;
        case dispatched:
            s[_dispatched] = value;
            break;
        case preventDefaultCalled:
            s[_preventDefaultCalled] = value;
            break;
        case stopImmediatePropagationCalled:
            s[_stopImmediatePropagationCalled] = value;
            break;
    }
}

/** @internal */
export function createInnerEvent(target: EventTarget, type: string, eventInitDict?: EventInit, isTrusted = true) {
    let event = new EventP(type, eventInitDict);
    event[state].target = target;
    event[state][_isTrusted] = isTrusted;
    return event;
}

const EventE = g["EventTarget"] ? g["Event"] : EventP;
export { EventE as Event };
