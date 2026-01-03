import { g, polyfill, Class_setStringTag } from "./isPolyfill";
import { EventTarget_fire } from "./EventTargetP";
import { EventP, eventState, Event_setTrusted } from "./EventP";

/** @internal */
const state = Symbol(/* "ProgressEventState" */);

export class ProgressEventP extends EventP implements ProgressEvent {
    constructor(type: string, eventInitDict?: ProgressEventInit) {
        super(type, eventInitDict);
        this[state] = new ProgressEventState();
        const s = this[state];

        s.lengthComputable = !!eventInitDict?.lengthComputable;
        s.loaded = Number(eventInitDict?.loaded ?? 0);
        s.total = Number(eventInitDict?.total ?? 0);

        let errField = "";
        if (isNaN(s.loaded)) { errField = "loaded"; }
        if (isNaN(s.total)) { errField = "total"; }
        if (errField) {
            throw new TypeError(`Failed to construct 'ProgressEvent': Failed to read the '${errField}' property from 'ProgressEventInit': The provided double value is non-finite.`);
        }
    }

    /** @internal */
    [state]: ProgressEventState;

    get lengthComputable() { return getValue(this[state].lengthComputable); }
    get loaded() { return getValue(this[state].loaded); }
    get total() { return getValue(this[state].total); }

    /** @internal */ toString() { return "[object ProgressEvent]"; }
    /** @internal */ get isPolyfill() { return { symbol: polyfill, hierarchy: ["ProgressEvent", "Event"] }; }
}

Class_setStringTag(ProgressEventP, "ProgressEvent");

/** @internal */
class ProgressEventState {
    lengthComputable: boolean | (() => boolean) = false;
    loaded: number | (() => number) = 0;
    total: number | (() => number) = 0;
}

function getValue<T>(val: T | (() => T)) {
    return typeof val === "function" ? (val as () => T)() : val;
}

/** @internal */
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
): ProgressEvent {
    let event = new ProgressEventP(type);
    event[state].lengthComputable = lengthComputable;
    event[state].loaded = loaded;
    event[state].total = total;

    event[eventState].target = target;
    Event_setTrusted(event, true);
    return event;
}

/** @internal */
export function emitProcessEvent(target: EventTarget, type: string, loaded: number | (() => number) = 0, total: number | (() => number) = 0) {
    let event = createInnerProgressEvent(target, type, {
        lengthComputable: () => { return getValue(total) > 0; },
        loaded,
        total,
    });

    EventTarget_fire(target, event);
}

const ProgressEventE = g["EventTarget"] ? g["ProgressEvent"] : ProgressEventP;
export { ProgressEventE as ProgressEvent };
