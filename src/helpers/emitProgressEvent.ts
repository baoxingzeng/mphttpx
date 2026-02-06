import { Event_setTrusted } from "../event-system/EventP";
import { EventTarget_fire } from "../event-system/EventTargetP";
import { ProgressEventP } from "../event-system/ProgressEventP";

/** @internal */
export function emitProgressEvent(target: EventTarget, type: string, loaded = 0, total = 0) {
    let event = new ProgressEventP(type, {
        lengthComputable: total > 0,
        loaded,
        total,
    });

    event.__Event__.target = target;
    Event_setTrusted(event, true);
    EventTarget_fire(target, event);
}
