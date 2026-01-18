import { HeadersP } from "../HeadersP";
import { Blob_toUint8Array, BlobP } from "../BlobP";
import { CloseEventP } from "../CloseEventP";
import { MessageEventP } from "../MessageEventP";
import { Event_setTrusted, createInnerEvent } from "../EventP";
import { EventTargetP, EventTarget_fire, attachFn, executeFn } from "../EventTargetP";
import { connectSocket } from "./connectSocket";
import type { TConnectSocketFunc, IConnectSocketOption, ISocketTask } from "./connectSocket";
import { polyfill, Class_setStringTag, checkArgsLength, MPException, isPolyfillType } from "../isPolyfill";

const mp = { connectSocket: connectSocket };
export const setConnectSocket = (connectSocket: unknown) => { mp.connectSocket = connectSocket as TConnectSocketFunc; }

/** @internal */
const state = Symbol(/* "WebSocketState" */);

export class WebSocketImpl extends EventTargetP implements WebSocket {
    declare static readonly CONNECTING: 0;
    declare static readonly OPEN: 1;
    declare static readonly CLOSING: 2;
    declare static readonly CLOSED: 3;

    constructor(...args: [string | URL, (string | string[])?]) {
        const [url, protocols] = args;
        checkArgsLength(args, 1, "WebSocket");
        super();
        this[state] = new WebSocketState(this, {
            url: "" + url,
            protocols: protocols !== undefined
                ? (Array.isArray(protocols) || (protocols && typeof protocols === "object" && Symbol.iterator in protocols))
                    ? Array.isArray(protocols) ? protocols : Array.from<string>(protocols as never)
                    : ["" + protocols]
                : [],
            multiple: true, // Alipay Mini Program
            fail(err: unknown) { console.error(err); },
        });

        let socketTask = this[state][_socketTask];
        if (socketTask && typeof socketTask === "object") {
            onOpen(this);
            onClose(this);
            onError(this);
            onMessage(this);
        } else {
            throw new Error(`connectSocket can't establish a connection to the server at ${"" + url}.`);
        }
    }

    /** @internal */
    [state]: WebSocketState;
    
    declare readonly CONNECTING: 0;
    declare readonly OPEN: 1;
    declare readonly CLOSING: 2;
    declare readonly CLOSED: 3;

    get binaryType() { return this[state].binaryType; }
    set binaryType(value) { if (value === "blob" || value === "arraybuffer") { this[state].binaryType = value; } }

    get bufferedAmount() { return this[state].bufferedAmount; }
    get extensions() { return this[state].extensions; }
    get protocol() { return this[state].protocol; }
    get readyState() { return this[state].readyState; }
    get url() { return this[state].url; }

    close(code?: number, reason?: string): void {
        if (this.readyState === WebSocketImpl.CLOSING || this.readyState === WebSocketImpl.CLOSED) return;
        this[state].readyState = WebSocketImpl.CLOSING;

        this[state][_socketTask].close({
            code: code,
            reason: reason,
            fail(err: unknown) { console.error(err); },
            complete: (function (this: WebSocket) {
                (this as WebSocketImpl)[state].readyState = WebSocketImpl.CLOSED;
            }).bind(this),
        });
    }

    send(...args: [string | ArrayBufferLike | Blob | ArrayBufferView]): void {
        const [data] = args;
        checkArgsLength(args, 1, "WebSocket", "send");

        if (this.readyState === WebSocketImpl.CONNECTING) {
            throw new MPException("Failed to execute 'send' on 'WebSocket': Still in CONNECTING state.", "InvalidStateError");
        }

        if (this.readyState === WebSocketImpl.CLOSING || this.readyState === WebSocketImpl.CLOSED) {
            return console.error("WebSocket is already in CLOSING or CLOSED state.");
        }

        let _data: string | ArrayBuffer;

        if (data instanceof ArrayBuffer) {
            _data = data;
        } else if (ArrayBuffer.isView(data)) {
            _data = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
        } else if (isPolyfillType<Blob>("Blob", data)) {
            _data = Blob_toUint8Array(data).buffer.slice(0);
        } else {
            _data = "" + data;
        }

        this[state][_socketTask].send({
            data: _data,
            fail(err: unknown) { console.error(err); },
        });
    }

    get onclose() { return this[state].onclose; }
    set onclose(value) { this[state].onclose = value; attach(this, "close"); }

    get onerror() { return this[state].onerror; }
    set onerror(value) { this[state].onerror = value; attach(this, "error"); }

    get onmessage() { return this[state].onmessage; }
    set onmessage(value) { this[state].onmessage = value; attach(this, "message"); }

    get onopen() { return this[state].onopen; }
    set onopen(value) { this[state].onopen = value; attach(this, "open"); }

    /** @internal */ toString() { return "[object WebSocket]"; }
    /** @internal */ get isPolyfill() { return { symbol: polyfill, hierarchy: ["WebSocket", "EventTarget"] }; }
}

const properties = {
    CONNECTING: { value: 0, enumerable: true },
    OPEN: { value: 1, enumerable: true },
    CLOSING: { value: 2, enumerable: true },
    CLOSED: { value: 3, enumerable: true },
};

Object.defineProperties(WebSocketImpl, properties);
Object.defineProperties(WebSocketImpl.prototype, properties);

Class_setStringTag(WebSocketImpl, "WebSocket");

/** @internal */ const _socketTask = Symbol();
/** @internal */ const _error = Symbol();
/** @internal */ const _handlers = Symbol();

/** @internal */
class WebSocketState {
    constructor(target: WebSocket, opts: IConnectSocketOption) {
        this.target = target;
        this.url = opts.url;
        this[_socketTask] = mp.connectSocket(opts);
    }

    target: WebSocket;

    binaryType: BinaryType = "blob";
    bufferedAmount = 0;
    extensions = "";
    protocol = "";
    readyState = 0;
    url: string;

    [_socketTask]: ISocketTask;
    [_error]: unknown = null;

    readonly [_handlers] = getHandlers(this);
    onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null;
    onerror: ((this: WebSocket, ev: Event) => any) | null = null;
    onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null = null;
    onopen: ((this: WebSocket, ev: Event) => any) | null = null;
}

function attach(target: WebSocket, type: keyof WebSocketEventMap) {
    const s = (target as WebSocketImpl)[state];
    const fnName = ("on" + type) as `on${typeof type}`;
    const cb = s[fnName];
    const listener = s[_handlers][fnName];
    attachFn(target, type, cb, listener as EventListener);
}

function getHandlers(s: WebSocketState) {
    return {
        onclose: (ev: CloseEvent) => { executeFn(s.target, s.onclose, ev); },
        onerror: (ev: Event) => { executeFn(s.target, s.onerror, ev); },
        onmessage: (ev: MessageEvent) => { executeFn(s.target, s.onmessage, ev); },
        onopen: (ev: Event) => { executeFn(s.target, s.onopen, ev); },
    };
}

function onOpen(ws: WebSocket) {
    let _ws = ws as WebSocketImpl;
    let task = _ws[state][_socketTask];

    task.onOpen(res => {
        if ("header" in res && res.header && typeof res.header === "object") {
            let headers = new HeadersP(res.header as Record<string, string>);
            _ws[state].protocol = headers.get("Sec-WebSocket-Protocol") || "";
        }

        _ws[state].readyState = WebSocketImpl.OPEN;
        EventTarget_fire(_ws, createInnerEvent(_ws, "open"));
    });
}

function onClose(ws: WebSocket) {
    let _ws = ws as WebSocketImpl;
    let task = _ws[state][_socketTask];

    task.onClose(res => {
        _ws[state].readyState = WebSocketImpl.CLOSED;

        let event = new CloseEventP("close", {
            wasClean: !_ws[state][_error],
            code: res.code,
            reason: res.reason,
        });

        Event_setTrusted(event, true);
        EventTarget_fire(_ws, event);
    });
}

function onError(ws: WebSocket) {
    let _ws = ws as WebSocketImpl;
    let task = _ws[state][_socketTask];

    task.onError(res => {
        console.error(res);

        _ws[state][_error] = res;
        _ws[state].readyState = WebSocketImpl.CLOSED;
        EventTarget_fire(_ws, createInnerEvent(_ws, "error"));
    });
}

function onMessage(ws: WebSocket) {
    let _ws = ws as WebSocketImpl;
    let task = _ws[state][_socketTask];

    task.onMessage(res => {
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

        if (_data instanceof ArrayBuffer && _ws.binaryType === "blob") {
            _data = new BlobP([_data]);
        }

        let event = new MessageEventP("message", {
            data: _data,
            origin: _ws.url,
        });

        Event_setTrusted(event, true);
        EventTarget_fire(_ws, event);
    });
}
