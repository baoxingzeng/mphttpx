import { EventP } from "./EventP";
import { SymbolP, setState } from "../utils";

export class ProgressEventP extends EventP implements ProgressEvent {
    constructor(type: string, eventInitDict?: ProgressEventInit) {
        super(type, eventInitDict);
        setState(this, "__ProgressEvent__", new ProgressEventState());
        const s = state(this);

        s.lengthComputable = !!eventInitDict?.lengthComputable;
        s.loaded = Number(eventInitDict?.loaded ?? 0);
        s.total = Number(eventInitDict?.total ?? 0);

        checkNumberField("loaded", this.loaded);
        checkNumberField("total", this.total);
    }

    /** @internal */ declare readonly __ProgressEvent__: ProgressEventState;

    get lengthComputable(): boolean { return state(this).lengthComputable; }
    get loaded(): number { return state(this).loaded; }
    get total(): number { return state(this).total; }

    /** @internal */ toString() { return "[object ProgressEvent]"; }
    /** @internal */ get [SymbolP.toStringTag]() { return "ProgressEvent"; }
    /** @internal */ get __MPHTTPX__() { return { chain: ["ProgressEvent", "Event"] }; }
}

/** @internal */
class ProgressEventState {
    lengthComputable = false;
    loaded = 0;
    total = 0;
}

function state(target: ProgressEventP) {
    return target.__ProgressEvent__;
}

function checkNumberField(field: string, value: number) {
    if (isNaN(value)) {
        throw new TypeError(`Failed to construct 'ProgressEvent': Failed to read the '${field}' property from 'ProgressEventInit': The provided double value is non-finite.`);
    }
}
