import { EventP } from "./EventP";
import { SymbolP, setState, checkArgsLength } from "../utils";

export class MessageEventP<T> extends EventP implements MessageEvent {
    constructor(type: string, eventInitDict?: MessageEventInit<T>) {
        super(type, eventInitDict);
        setState(this, "__MessageEvent__", new MessageEventState());
        const s = state(this);

        s.data = eventInitDict?.data ?? null;
        if (eventInitDict?.origin !== undefined) s.origin = "" + eventInitDict.origin;
        if (eventInitDict?.lastEventId !== undefined) s.lastEventId = "" + eventInitDict.lastEventId;
        if (eventInitDict?.source !== undefined) s.source = eventInitDict.source;
        if (eventInitDict?.ports !== undefined) s.ports = eventInitDict.ports;
    }

    /** @internal */ declare readonly __MessageEvent__: MessageEventState;

    get data(): T { return state(this).data as T; }
    get lastEventId(): string { return state(this).lastEventId; }
    get origin(): string { return state(this).origin; }
    get ports(): ReadonlyArray<MessagePort> { return state(this).ports; }
    get source(): MessageEventSource | null { return state(this).source; }

    initMessageEvent(type: string, bubbles?: boolean, cancelable?: boolean, data?: any, origin?: string, lastEventId?: string, source?: MessageEventSource | null, ports?: Iterable<MessagePort>): void {
        checkArgsLength(arguments.length, 1, "MessageEvent", "initMessageEvent");
        if (this.__Event__.eventDispatched) return;

        this.initEvent(type, bubbles, cancelable);
        const s = state(this);

        s.data = data ?? null;
        if (origin !== undefined) s.origin = "" + origin;
        if (lastEventId !== undefined) s.lastEventId = "" + lastEventId;
        if (source !== undefined) s.source = source;
        if (ports !== undefined) s.ports = Array.from(ports);
    }

    /** @internal */ toString() { return "[object MessageEvent]"; }
    /** @internal */ get [SymbolP.toStringTag]() { return "MessageEvent"; }
    /** @internal */ get __MPHTTPX__() { return { chain: ["MessageEvent", "Event"] }; }
}

/** @internal */
class MessageEventState {
    data: unknown = null;
    lastEventId = "";
    origin = "";
    ports: MessagePort[] = [];
    source: MessageEventSource | null = null;
}

function state<T>(target: MessageEventP<T>) {
    return target.__MessageEvent__;
}
