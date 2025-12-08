import { EventP, eventState, _isTrusted } from "./EventP";
import { g, polyfill, defineStringTag } from "./isPolyfill";
import { EventTargetP, eventTargetState, fire } from "./EventTargetP";

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

    [state]: ProgressEventState;

    get lengthComputable() { return getValue(this[state].lengthComputable); }
    get loaded() { return getValue(this[state].loaded); }
    get total() { return getValue(this[state].total); }

    toString() { return "[object ProgressEvent]"; }
    get isPolyfill() { return { symbol: polyfill, hierarchy: ["ProgressEvent", "Event"] }; }
}

defineStringTag(ProgressEventP, "ProgressEvent");

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
    const event = new ProgressEventP(type);
    event[state].lengthComputable = lengthComputable;
    event[state].loaded = loaded;
    event[state].total = total;

    event[eventState].target = target;
    event[eventState][_isTrusted] = true;
    return event;
}

export function emitProcessEvent(target: EventTargetP, type: string, loaded: number | (() => number) = 0, total: number | (() => number) = 0) {
    const event = createInnerProgressEvent(target, type, {
        lengthComputable: () => { return getValue(total) > 0; },
        loaded,
        total,
    });

    fire.call(target[eventTargetState], event);
}

const ProgressEventE = g["EventTarget"] ? g["ProgressEvent"] : ProgressEventP;
export { ProgressEventE as ProgressEvent };
