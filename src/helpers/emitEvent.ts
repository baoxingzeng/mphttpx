import { EventTarget_fire } from "../event-system/EventTargetP";
import { EventP, Event_setTrusted } from "../event-system/EventP";

/** @internal */
export function emitEvent(target: EventTarget, type: string) {
    let event = new EventP(type);
    event.__Event__.target = target;
    Event_setTrusted(event, true);
    EventTarget_fire(target, event);
}
