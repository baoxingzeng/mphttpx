import { g, polyfill, dfStringTag } from "./isPolyfill";
import { EventTargetP, EventTarget_fire } from "./EventTargetP";
import { EventP, eventState, Event_setTrusted } from "./EventP";

/** @internal */
const state = Symbol(/* "ProgressEventState" */);

export class ProgressEventP extends EventP implements ProgressEvent {
    constructor(type: string, eventInitDict?: ProgressEventInit) {
        super(type, eventInitDict);
        this[state] = new ProgressEventState();
        const that = this[state];

        that.lengthComputable = !!eventInitDict?.lengthComputable;
        that.loaded = eventInitDict?.loaded ?? 0;
        that.total = eventInitDict?.total ?? 0;
    }

    /** @internal */
    [state]: ProgressEventState;

    get lengthComputable() { return getValue(this[state].lengthComputable); }
    get loaded() { return getValue(this[state].loaded); }
    get total() { return getValue(this[state].total); }

    toString() { return "[object ProgressEvent]"; }
    get isPolyfill() { return { symbol: polyfill, hierarchy: ["ProgressEvent", "Event"] }; }
}

dfStringTag(ProgressEventP, "ProgressEvent");

/** @internal */
class ProgressEventState {
    lengthComputable: boolean | (() => boolean) = false;
    loaded: number | (() => number) = 0;
    total: number | (() => number) = 0;
}

function getValue<T>(val: T | (() => T)) {
    return typeof val === "function" ? (val as () => T)() : val;
}

interface TCreateExtraParams {
    lengthComputable: boolean | (() => boolean);
    loaded: number | (() => number);
    total: number | (() => number);
}

function createInnerProgressEvent(
    target: EventTarget,
    type: string,
    {
        lengthComputable = false,
        loaded = 0,
        total = 0,
    }: Partial<TCreateExtraParams> = {},
) {
    let event = new ProgressEventP(type);
    event[state].lengthComputable = lengthComputable;
    event[state].loaded = loaded;
    event[state].total = total;

    event[eventState].target = target;
    Event_setTrusted(event, true);
    return event;
}

/** @internal */
export function emitProcessEvent(target: EventTargetP, type: string, loaded: number | (() => number) = 0, total: number | (() => number) = 0) {
    let event = createInnerProgressEvent(target, type, {
        lengthComputable: () => { return getValue(total) > 0; },
        loaded,
        total,
    });

    EventTarget_fire(target, event);
}

const ProgressEventE = g["EventTarget"] ? g["ProgressEvent"] : ProgressEventP;
export { ProgressEventE as ProgressEvent };
