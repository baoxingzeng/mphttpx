import { type Event_EtFields } from "./EventP";
import { EventP, Event_getEtField } from "./EventP";
import { g, polyfill, Class_setStringTag, checkArgsLength } from "./isPolyfill";

const dispatched: Event_EtFields["Dispatched"] = 1;

/** @internal */
const state = Symbol(/* "MessageEventState" */);

export class MessageEventP<T> extends EventP implements MessageEvent {
    constructor(type: string, eventInitDict?: MessageEventInit<T>) {
        super(type, eventInitDict);
        this[state] = new MessageEventState();

        this[state].data = eventInitDict?.data ?? null;
        if (eventInitDict?.origin !== undefined) this[state].origin = "" + eventInitDict.origin;
        if (eventInitDict?.lastEventId !== undefined) this[state].lastEventId = "" + eventInitDict.lastEventId;
        if (eventInitDict?.source !== undefined) this[state].source = eventInitDict.source;
        if (eventInitDict?.ports !== undefined) this[state].ports = eventInitDict.ports;
    }

    /** @internal */
    [state]: MessageEventState;

    get data() { return this[state].data as T; }
    get lastEventId() { return this[state].lastEventId; }
    get origin() { return this[state].origin; }
    get ports() { return this[state].ports; }
    get source() { return this[state].source; }

    initMessageEvent(...args: [string, boolean?, boolean?, any?, string?, string?, (MessageEventSource | null)?, MessagePort[]?]): void {
        const [type, bubbles, cancelable, data, origin, lastEventId, source, ports] = args;
        checkArgsLength(args, 1, "MessageEvent", "initMessageEvent");
        if (Event_getEtField(this, dispatched)) return;

        this.initEvent(type, bubbles, cancelable);
        this[state].data = data ?? null;
        if (origin !== undefined) this[state].origin = "" + origin;
        if (lastEventId !== undefined) this[state].lastEventId = "" + lastEventId;
        if (source !== undefined) this[state].source = source;
        if (ports !== undefined) this[state].ports = ports;
    }

    /** @internal */ toString() { return "[object MessageEvent]"; }
    /** @internal */ get isPolyfill() { return { symbol: polyfill, hierarchy: ["MessageEvent", "Event"] }; }
}

Class_setStringTag(MessageEventP, "MessageEvent");

/** @internal */
class MessageEventState {
    data: unknown = null;
    lastEventId =  "";
    origin = "";
    ports: MessagePort[] = [];
    source: MessageEventSource | null = null;
}

const MessageEventE = g["EventTarget"] ? g["MessageEvent"] : MessageEventP;
export { MessageEventE as MessageEvent };
