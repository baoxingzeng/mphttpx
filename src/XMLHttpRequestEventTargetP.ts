import { polyfill } from "./isPolyfill";
import { EventTargetP, attachFn, executeFn } from "./EventTargetP";

/** @internal */ const state = Symbol(/* "XMLHttpRequestEventTargetState" */);
/** @internal */ export { state as xhrEventTargetState };

export class XMLHttpRequestEventTargetP extends EventTargetP implements XMLHttpRequestEventTarget {
    /** @internal */
    constructor() {
        if (new.target === XMLHttpRequestEventTargetP) {
            throw new TypeError("Failed to construct 'XMLHttpRequestEventTarget': Illegal constructor");
        }

        super();
        this[state] = new XMLHttpRequestEventTargetState(this);
    }

    /** @internal */
    [state]: XMLHttpRequestEventTargetState;

    get onabort() { return this[state].onabort; }
    set onabort(value) { this[state].onabort = value; attach(this, "abort"); }

    get onerror() { return this[state].onerror; }
    set onerror(value) { this[state].onerror = value; attach(this, "error"); }

    get onload() { return this[state].onload; }
    set onload(value) { this[state].onload = value; attach(this, "load"); }

    get onloadend() { return this[state].onloadend; }
    set onloadend(value) { this[state].onloadend = value; attach(this, "loadend"); }

    get onloadstart() { return this[state].onloadstart; }
    set onloadstart(value) { this[state].onloadstart = value; attach(this, "loadstart"); }

    get onprogress() { return this[state].onprogress; }
    set onprogress(value) { this[state].onprogress = value; attach(this, "progress"); }

    get ontimeout() { return this[state].ontimeout; }
    set ontimeout(value) { this[state].ontimeout = value; attach(this, "timeout"); }

    /** @internal */ toString() { return "[object XMLHttpRequestEventTarget]"; }
    /** @internal */ get [Symbol.toStringTag]() { return "XMLHttpRequestEventTarget"; }
    /** @internal */ get isPolyfill() { return { symbol: polyfill, hierarchy: ["XMLHttpRequestEventTarget", "EventTarget"] }; }
}

/** @internal */
const _handlers = Symbol();

/** @internal */
export class XMLHttpRequestEventTargetState {
    /**
     * @param _target XMLHttpRequestEventTarget
     */
    constructor(_target: unknown) {
        this.target = _target as XMLHttpRequest;
    }

    target: XMLHttpRequest;

    readonly [_handlers] = getHandlers(this);
    onabort: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
    onerror: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
    onload: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
    onloadend: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
    onloadstart: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
    onprogress: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
    ontimeout: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
}

function attach(target: XMLHttpRequestEventTarget, type: keyof XMLHttpRequestEventTargetEventMap) {
    const s = (target as XMLHttpRequestEventTargetP)[state];
    const fnName = ("on" + type) as `on${typeof type}`;
    const cb = s[fnName];
    const listener = s[_handlers][fnName];
    attachFn(target, type, cb, listener as EventListener);
}

function getHandlers(s: XMLHttpRequestEventTargetState) {
    return {
        onabort: (ev: ProgressEvent) => { executeFn(s.target, s.onabort, ev); },
        onerror: (ev: ProgressEvent) => { executeFn(s.target, s.onerror, ev); },
        onload: (ev: ProgressEvent) => { executeFn(s.target, s.onload, ev); },
        onloadend: (ev: ProgressEvent) => { executeFn(s.target, s.onloadend, ev); },
        onloadstart: (ev: ProgressEvent) => { executeFn(s.target, s.onloadstart, ev); },
        onprogress: (ev: ProgressEvent) => { executeFn(s.target, s.onprogress, ev); },
        ontimeout: (ev: ProgressEvent) => { executeFn(s.target, s.ontimeout, ev); },
    };
}

const responseTypes = ["", "text", "json", "arraybuffer", "blob", "document"];

/** @internal */
export function normalizeResponseType(responseType: string): XMLHttpRequestResponseType {
    return responseTypes.indexOf(responseType) > -1 ? responseType as XMLHttpRequestResponseType : "";
}

const statusMessages: Record<string, string> = {
    100: "Continue",
    101: "Switching Protocols",
    102: "Processing",
    103: "Early Hints",
    200: "OK",
    201: "Created",
    202: "Accepted",
    203: "Non-Authoritative Information",
    204: "No Content",
    205: "Reset Content",
    206: "Partial Content",
    207: "Multi-Status",
    208: "Already Reported",
    226: "IM Used",
    300: "Multiple Choices",
    301: "Moved Permanently",
    302: "Found",
    303: "See Other",
    304: "Not Modified",
    307: "Temporary Redirect",
    308: "Permanent Redirect",
    400: "Bad Request",
    401: "Unauthorized",
    402: "Payment Required",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    406: "Not Acceptable",
    407: "Proxy Authentication Required",
    408: "Request Timeout",
    409: "Conflict",
    410: "Gone",
    411: "Length Required",
    412: "Precondition Failed",
    413: "Content Too Large",
    414: "URI Too Long",
    415: "Unsupported Media Type",
    416: "Range Not Satisfiable",
    417: "Expectation Failed",
    418: "I'm a teapot",
    421: "Misdirected Request",
    422: "Unprocessable Entity",
    423: "Locked",
    424: "Failed Dependency",
    425: "Too Early",
    426: "Upgrade Required",
    428: "Precondition Required",
    429: "Too Many Requests",
    431: "Request Header Fields Too Large",
    451: "Unavailable For Legal Reasons",
    500: "Internal Server Error",
    501: "Not Implemented",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
    505: "HTTP Version Not Supported",
    506: "Variant Also Negotiates",
    507: "Insufficient Storage",
    508: "Loop Detected",
    510: "Not Extended",
    511: "Network Authentication Required"
};

/** @internal */
export function statusTextMap(val: number) {
    return statusMessages[val] || "unknown";
}
