import { BlobP } from "../file-system/BlobP";
import { Payload } from "../helpers/Payload";
import { HeadersP } from "../fetch-api/HeadersP";
import { CloseEventP } from "../event-system/CloseEventP";
import { MessageEventP } from "../event-system/MessageEventP";
import { emitEvent } from "../helpers/emitEvent";
import { attachFn, executeFn } from "../helpers/handlers";
import { Event_setTrusted } from "../event-system/EventP";
import { EventTargetP, EventTarget_fire } from "../event-system/EventTargetP";
import { isSequence } from "../helpers/isSequence";
import { isArrayBuffer } from "../helpers/isArrayBuffer";
import { SymbolP, DOMExceptionP, setState, checkArgsLength } from "../utils";
import { getConnectSocket } from "./connectSocket";
import type { TConnectSocketFunc, IConnectSocketOption, ISocketTask } from "./connectSocket";

const mp = { connectSocket: getConnectSocket() };
export function setConnectSocket(connectSocket: unknown) { mp.connectSocket = connectSocket as TConnectSocketFunc; }

export class WebSocketImpl extends EventTargetP implements WebSocket {
    static get CONNECTING(): 0 { return 0; }
    static get OPEN(): 1 { return 1; }
    static get CLOSING(): 2 { return 2; }
    static get CLOSED(): 3 { return 3; }

    constructor(url: string | URL, protocols?: string | string[]) {
        checkArgsLength(arguments.length, 1, "WebSocket");
        super();
        setState(this, "__WebSocket__", new WebSocketState(this, {
            url: "" + url,
            protocols: protocols !== undefined
                ? isSequence(protocols)
                    ? Array.isArray(protocols) ? protocols : Array.from<string>(protocols)
                    : ["" + protocols]
                : [],
            multiple: true, // Alipay Mini Program
            fail(err: unknown) { console.error(err); },
        }));

        let socketTask = state(this).socketTask;
        if (socketTask && typeof socketTask === "object") {
            onOpen(this);
            onClose(this);
            onError(this);
            onMessage(this);
        } else {
            throw new Error(`connectSocket can't establish a connection to the server at ${"" + url}.`);
        }
    }

    /** @internal */ declare readonly __WebSocket__: WebSocketState;

    get CONNECTING(): 0 { return 0; }
    get OPEN(): 1 { return 1; }
    get CLOSING(): 2 { return 2; }
    get CLOSED(): 3 { return 3; }

    get binaryType() { return state(this).binaryType; }
    set binaryType(value) { if (value === "blob" || value === "arraybuffer") { state(this).binaryType = value; } }

    get bufferedAmount() { return state(this).bufferedAmount; }
    get extensions() { return state(this).extensions; }
    get protocol() { return state(this).protocol; }
    get readyState() { return state(this).readyState; }
    get url() { return state(this).url; }

    close(code?: number, reason?: string): void {
        if (this.readyState === 2 /* CLOSING */ || this.readyState === 3 /* CLOSED */) return;
        state(this).readyState = 2 /* CLOSING */;

        state(this).socketTask.close({
            code: code,
            reason: reason,
            fail(err: unknown) { console.error(err); },
            complete: (function (this: WebSocketImpl) {
                state(this).readyState = 3 /* CLOSED */;
            }).bind(this),
        });
    }

    send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
        checkArgsLength(arguments.length, 1, "WebSocket", "send");
        if (this.readyState === 0 /* CONNECTING */) {
            throw new DOMExceptionP("Failed to execute 'send' on 'WebSocket': Still in CONNECTING state.", "InvalidStateError");
        }

        if (this.readyState === 2 /* CLOSING */ || this.readyState === 3 /* CLOSED */) {
            return console.error("WebSocket is already in CLOSING or CLOSED state.");
        }

        const transfer = (function (this: WebSocketImpl, data: string | ArrayBuffer) {
            if (this.readyState !== 1 /* OPEN */) return;
            state(this).socketTask.send({ data, fail(err: unknown) { console.error(err); } });
        }).bind(this);

        let payload = new Payload(data ?? "" + data);
        payload.promise.then(transfer);
    }

    get onclose() { return state(this).onclose; }
    set onclose(value) { state(this).onclose = value; state(this).attach("close"); }

    get onerror() { return state(this).onerror; }
    set onerror(value) { state(this).onerror = value; state(this).attach("error"); }

    get onmessage() { return state(this).onmessage; }
    set onmessage(value) { state(this).onmessage = value; state(this).attach("message"); }

    get onopen() { return state(this).onopen; }
    set onopen(value) { state(this).onopen = value; state(this).attach("open"); }

    /** @internal */ toString() { return "[object WebSocket]"; }
    /** @internal */ get [SymbolP.toStringTag]() { return "WebSocket"; }
    /** @internal */ get __MPHTTPX__() { return { chain: ["WebSocket", "EventTarget"] }; }
}

/** @internal */
class WebSocketState {
    constructor(target: WebSocket, opts: IConnectSocketOption) {
        this.target = target;
        this.url = opts.url;
        this.socketTask = mp.connectSocket(opts);
        this.attach = attachFn<WebSocket, keyof WebSocketEventMap>(target, getHandlers(target));
    }

    target: WebSocket;

    binaryType: BinaryType = "blob";
    bufferedAmount = 0;
    extensions = "";
    protocol = "";
    readyState = 0;
    url: string;

    socketTask: ISocketTask;
    error: unknown = null;

    attach: (type: keyof WebSocketEventMap) => void;
    onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null;
    onerror: ((this: WebSocket, ev: Event) => any) | null = null;
    onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null = null;
    onopen: ((this: WebSocket, ev: Event) => any) | null = null;
}

function getHandlers(t: WebSocket) {
    return {
        onclose: (ev: CloseEvent) => { executeFn(t, t.onclose, ev); },
        onerror: (ev: Event) => { executeFn(t, t.onerror, ev); },
        onmessage: (ev: MessageEvent) => { executeFn(t, t.onmessage, ev); },
        onopen: (ev: Event) => { executeFn(t, t.onopen, ev); },
    };
}

function state(target: WebSocketImpl) {
    return target.__WebSocket__;
}

function onOpen(socket: WebSocketImpl) {
    state(socket).socketTask.onOpen(res => {
        if ("header" in res && res.header && typeof res.header === "object") {
            let headers = new HeadersP(res.header as Record<string, string>);
            state(socket).protocol = headers.get("Sec-WebSocket-Protocol") || "";
        }

        state(socket).readyState = 1 /* OPEN */;
        emitEvent(socket, "open");
    });
}

function onClose(socket: WebSocketImpl) {
    state(socket).socketTask.onClose(res => {
        state(socket).readyState = 3 /* CLOSED */;

        let event = new CloseEventP("close", {
            wasClean: !state(socket).error,
            code: res.code,
            reason: res.reason,
        });

        Event_setTrusted(event, true);
        EventTarget_fire(socket, event);
    });
}

function onError(socket: WebSocketImpl) {
    state(socket).socketTask.onError(res => {
        console.error(res);

        state(socket).error = res;
        state(socket).readyState = 3 /* CLOSED */;
        emitEvent(socket, "error");
    });
}

function onMessage(socket: WebSocketImpl) {
    state(socket).socketTask.onMessage(res => {
        let data = res.data;
        let _data: string | ArrayBuffer | Blob;

        // Alipay Mini Program
        if (data && typeof data === "object" && "data" in data) {
            _data = data.data;
            if ("isBuffer" in data && data.isBuffer && typeof _data === "string") {
                // @ts-ignore
                try { _data = my.base64ToArrayBuffer(_data); } catch (e) { }
            }
        } else {
            _data = data;
        }

        if (isArrayBuffer(_data) && socket.binaryType === "blob") {
            _data = new BlobP([_data]);
        }

        let event = new MessageEventP("message", {
            data: _data,
            origin: socket.url,
        });

        Event_setTrusted(event, true);
        EventTarget_fire(socket, event);
    });
}

const WebSocketE = (typeof WebSocket !== "undefined" && WebSocket) || WebSocketImpl;
export { WebSocketE as WebSocket };
