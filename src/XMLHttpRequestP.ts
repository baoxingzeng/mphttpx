import { HeadersP, normalizeName } from "./HeadersP";
import { Uint8Array_toBase64, encode } from "./BlobP";
import { convert, convertBack } from "./BodyImpl";
import { normalizeMethod } from "./RequestP";
import { EventTarget_fire, attachFn, executeFn } from "./EventTargetP";
import { createInnerEvent } from "./EventP";
import { emitProcessEvent } from "./ProgressEventP";
import { createXMLHttpRequestUpload } from "./XMLHttpRequestUploadP";
import { XMLHttpRequestEventTargetP } from "./XMLHttpRequestEventTargetP";
import type {
    TRequestFunc,
    IRequestOptions,
    IRequestTask,
    IRequestSuccessCallbackBaseResult,
    IRequestFailCallbackResult,
    IAliRequestFailCallbackResult
} from "./request";
import { request } from "./request";
import { polyfill, Class_setStringTag, checkArgsLength, MPException } from "./isPolyfill";

const mp = { request: request };
export const setRequest = (request: TRequestFunc) => { mp.request = request; }

/** @internal */
const state = Symbol(/* "XMLHttpRequestState" */);

/** @type {typeof globalThis.XMLHttpRequest} */
export class XMLHttpRequestP extends XMLHttpRequestEventTargetP implements XMLHttpRequest {
    declare static readonly UNSENT: 0;
    declare static readonly OPENED: 1;
    declare static readonly HEADERS_RECEIVED: 2;
    declare static readonly LOADING: 3;
    declare static readonly DONE: 4;

    constructor() {
        super();
        this[state] = new XMLHttpRequestState(this);
    }

    /** @internal */
    [state]: XMLHttpRequestState;

    declare readonly UNSENT: 0;
    declare readonly OPENED: 1;
    declare readonly HEADERS_RECEIVED: 2;
    declare readonly LOADING: 3;
    declare readonly DONE: 4;

    get readyState() { return this[state].readyState; }
    get response() { return this[state].response; }
    get responseText(): string { return (!this.responseType || this.responseType === "text") ? this.response : ""; }

    get responseType() { return this[state].responseType; }
    set responseType(value) { this[state].responseType = normalizeResponseType(value); }

    get responseURL() { return this[state].responseURL; }
    get responseXML(): Document | null { return null; }
    get status() { return this[state].status; }

    get statusText() {
        if (this.readyState === XMLHttpRequestP.UNSENT || this.readyState === XMLHttpRequestP.OPENED) return "";
        return this[state].statusText || statusTextMap(this.status);
    }

    get timeout() { return this[state].timeout; }
    set timeout(value) { this[state].timeout = value > 0 ? value : 0; }

    get upload() {
        const s = this[state];
        if (!s.upload) { s.upload = createXMLHttpRequestUpload(); }
        return s.upload!;
    }

    get withCredentials() { return this[state].withCredentials; }
    set withCredentials(value) { this[state].withCredentials = !!value; }

    abort(): void {
        clearRequest(this);
    }

    getAllResponseHeaders(): string {
        if (!this[state][_responseHeaders]) return "";
        return Array.from(this[state][_responseHeaders]!.entries()).map(([k, v]) => `${k}: ${v}\r\n`).join("");
    }

    getResponseHeader(...args: [string]): string | null {
        const [name] = args;
        checkArgsLength(args, 1, "XMLHttpRequest", "getResponseHeader");
        if (!this[state][_responseHeaders]) return null;
        return this[state][_responseHeaders]!.get(name);
    }

    open(...args: [method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null]): void {
        const [method, url, async = true, username = null, password = null] = args;
        checkArgsLength(args, 2, "XMLHttpRequest", "open");
        if (!async) {
            console.warn("Synchronous XMLHttpRequest is not supported because of its detrimental effects to the end user's experience.");
        }

        const s = this[state];
        clearRequest(this, false);

        s[_method] = normalizeMethod(method);
        s[_requestURL] = "" + url;

        if (username !== null || password !== null) {
            let _username = "" + (username ?? "");
            let _password = "" + (password ?? "");

            if (_username.length > 0 || _password.length > 0) {
                let auth = `Basic ${Uint8Array_toBase64(encode(_username + ":" + _password))}`;
                this.setRequestHeader("Authorization", auth);
            }
        }

        s[_inAfterOpenBeforeSend] = true;
        setReadyStateAndNotify(this, XMLHttpRequestP.OPENED);
    }

    overrideMimeType(...args: [string]): void {
        const [mime] = args;
        checkArgsLength(args, 1, "XMLHttpRequest", "overrideMimeType");
        if (this[state][_inAfterOpenBeforeSend]) {
            console.error(`TypeError: Failed to execute 'overrideMimeType' on 'XMLHttpRequest': mimeType ('${mime}') not implemented.`);
        }
    }

    send(body?: Document | XMLHttpRequestBodyInit | null): void {
        const s = this[state];

        if (!s[_inAfterOpenBeforeSend] || s.readyState !== XMLHttpRequestP.OPENED) {
            throw new MPException("Failed to execute 'send' on 'XMLHttpRequest': The object's state must be OPENED.", "InvalidStateError");
        }

        s[_inAfterOpenBeforeSend] = false;

        const allowsRequestBody = s[_method] !== "GET" && s[_method] !== "HEAD";
        const processHeaders = allowsRequestBody && !s[_requestHeaders].has("Content-Type");
        const processContentLength = allowsRequestBody && !!body;

        let headers = () => { let dict: Record<string, string> = {}; s[_requestHeaders].forEach((value, name) => { dict[name] = value; }); return dict; }
        let contentLength: () => number = zero;

        const processHeadersFn = processHeaders ? (v: string) => { s[_requestHeaders].set("Content-Type", v); } : void 0;
        const processContentLengthFn = processContentLength ? (v: () => number) => { contentLength = v; } : void 0;

        let data = body as string | ArrayBuffer;
        try { data = convert(body, false, processHeadersFn, processContentLengthFn); } catch (e) { console.warn(e); }

        let options: IRequestOptions = {
            url: s[_requestURL],
            method: s[_method] as NonNullable<IRequestOptions["method"]>,
            header: headers(),
            data,
            dataType: s.responseType === "json" ? "json" : normalizeDataType(s.responseType),
            responseType: normalizeDataType(s.responseType),
            withCredentials: s.withCredentials,
            success: requestSuccess.bind(this),
            fail: requestFail.bind(this),
            complete: requestComplete.bind(this),
        };

        s[_requestTask] = mp.request(options);
        emitProcessEvent(this, "loadstart");

        if (processContentLength && s.upload) {
            emitProcessEvent(this.upload, "loadstart", 0, contentLength);
        }

        setTimeout(() => {
            if (s.upload) {
                const _aborted = s[_inAfterOpenBeforeSend] || s.readyState !== XMLHttpRequestP.OPENED;
                const _contentLength = _aborted ? 0 : contentLength;

                if (_aborted) {
                    emitProcessEvent(this.upload, "abort");
                } else {
                    if (processContentLength) {
                        emitProcessEvent(this.upload, "load", _contentLength, _contentLength);
                    }
                }

                if (_aborted || processContentLength) {
                    emitProcessEvent(this.upload, "loadend", _contentLength, _contentLength);
                }
            }
        });

        checkRequestTimeout(this);
    }

    setRequestHeader(...args: [string, string]): void {
        const [name, value] = args;
        checkArgsLength(args, 2, "XMLHttpRequest", "setRequestHeader");

        const s = this[state];
        if (!s[_inAfterOpenBeforeSend] || s.readyState !== XMLHttpRequestP.OPENED) {
            throw new MPException("Failed to execute 'setRequestHeader' on 'XMLHttpRequest': The object's state must be OPENED.", "InvalidStateError");
        }

        let _name = normalizeName(name, () => {
            throw new SyntaxError(`Failed to execute 'setRequestHeader' on 'XMLHttpRequest': '${name}' is not a valid HTTP header field name.`);
        });

        s[_requestHeaders].append(_name, value);
    }

    get onreadystatechange() { return this[state].onreadystatechange; }
    set onreadystatechange(value) {
        this[state].onreadystatechange = value;
        attachFn(this, "readystatechange", value, this[state][_handlers].onreadystatechange);
    }

    /** @internal */ toString() { return "[object XMLHttpRequest]"; }
    /** @internal */ get isPolyfill() { return { symbol: polyfill, hierarchy: ["XMLHttpRequest", "XMLHttpRequestEventTarget", "EventTarget"] }; }
}

const properties = {
    UNSENT: { value: 0, enumerable: true },
    OPENED: { value: 1, enumerable: true },
    HEADERS_RECEIVED: { value: 2, enumerable: true },
    LOADING: { value: 3, enumerable: true },
    DONE: { value: 4, enumerable: true },
};

Object.defineProperties(XMLHttpRequestP, properties);
Object.defineProperties(XMLHttpRequestP.prototype, properties);

Class_setStringTag(XMLHttpRequestP, "XMLHttpRequest");

/** @internal */ const _handlers = Symbol();

/** @internal */ const _inAfterOpenBeforeSend = Symbol();
/** @internal */ const _resetPending = Symbol();
/** @internal */ const _timeoutId = Symbol();

/** @internal */ const _requestURL = Symbol();
/** @internal */ const _method = Symbol();
/** @internal */ const _requestHeaders = Symbol();
/** @internal */ const _responseHeaders = Symbol();
/** @internal */ const _responseContentLength = Symbol();

/** @internal */ const _requestTask = Symbol();

/** @internal */
class XMLHttpRequestState {
    constructor(target: XMLHttpRequest) {
        this.target = target;
    }

    target: XMLHttpRequest;

    readyState: XMLHttpRequest["readyState"] = XMLHttpRequestP.UNSENT;
    response: any = "";
    responseType: XMLHttpRequestResponseType = "";
    responseURL = "";
    status = 0;
    statusText = "";
    timeout = 0;
    upload?: XMLHttpRequestUpload;
    withCredentials = false;

    readonly [_handlers] = getHandlers(this);
    onreadystatechange: ((this: XMLHttpRequest, ev: Event) => any) | null = null;

    [_inAfterOpenBeforeSend] = false;
    [_resetPending] = false;
    [_timeoutId] = 0;

    [_requestURL] = "";
    [_method] = "GET";
    [_requestHeaders]: Headers = new HeadersP();
    [_responseHeaders]: Headers | null = null;
    [_responseContentLength]: () => number = zero;

    [_requestTask]: IRequestTask | null = null;
}

function requestSuccess(this: XMLHttpRequest, { statusCode, header, data }: IRequestSuccessCallbackBaseResult) {
    const s = (this as XMLHttpRequestP)[state];

    s.responseURL = s[_requestURL];
    s.status = statusCode;
    s[_responseHeaders] = new HeadersP(header as Record<string, string>);

    let lengthStr = s[_responseHeaders]!.get("Content-Length");
    s[_responseContentLength] = () => { return lengthStr ? parseInt(lengthStr) : 0; }

    if (s.readyState === XMLHttpRequestP.OPENED) {
        setReadyStateAndNotify(this, XMLHttpRequestP.HEADERS_RECEIVED);
        setReadyStateAndNotify(this, XMLHttpRequestP.LOADING);

        setTimeout(() => {
            if (!s[_inAfterOpenBeforeSend]) {
                let l = s[_responseContentLength];

                try {
                    s.response = convertBack(s.responseType, data);
                    emitProcessEvent(this, "load", l, l);
                } catch (e) {
                    console.error(e);
                    emitProcessEvent(this, "error");
                }
            }
        });
    }
}

function requestFail(this: XMLHttpRequest, err: IRequestFailCallbackResult | IAliRequestFailCallbackResult) {
    // Alipay Mini Programs
    // error: 14 --- JSON parse data error
    // error: 19 --- http status error
    // At this point, the error data object will contain three pieces of information
    // returned from the server: status, headers, and data.
    // In the browser's XMLHttpRequest, these two errors (Error 14 and Error 19)
    // differ from those in Alipay Mini Programs and should instead return normally.
    // Therefore, this scenario is also handled here as a successful request response.
    if ("status" in err) {
        requestSuccess.call(this, { statusCode: err.status!, header: err.headers!, data: err.data! });
        return;
    }

    const s = (this as XMLHttpRequestP)[state];
    s.status = 0;
    s.statusText = "errMsg" in err ? err.errMsg : "errorMessage" in err ? err.errorMessage : "";

    if (!s[_inAfterOpenBeforeSend] && s.readyState !== XMLHttpRequestP.UNSENT && s.readyState !== XMLHttpRequestP.DONE) {
        emitProcessEvent(this, "error");
        resetRequestTimeout(this);
    }
}

function requestComplete(this: XMLHttpRequest) {
    const s = (this as XMLHttpRequestP)[state];
    s[_requestTask] = null;

    if (!s[_inAfterOpenBeforeSend] && (s.readyState === XMLHttpRequestP.OPENED || s.readyState === XMLHttpRequestP.LOADING)) {
        setReadyStateAndNotify(this, XMLHttpRequestP.DONE);
    }

    setTimeout(() => {
        if (!s[_inAfterOpenBeforeSend]) {
            let l = s[_responseContentLength];
            emitProcessEvent(this, "loadend", l, l);
        }
    });
}

function clearRequest(xhr: XMLHttpRequest, delay = true) {
    const s = (xhr as XMLHttpRequestP)[state];
    const timerFn = delay ? setTimeout : (f: () => void) => { f(); };
    s[_resetPending] = true;

    if (s[_requestTask] && s.readyState !== XMLHttpRequestP.DONE) {
        if (delay) { setReadyStateAndNotify(xhr, XMLHttpRequestP.DONE); }

        timerFn(() => {
            const requestTask = s[_requestTask];

            if (requestTask) { requestTask.abort(); }
            if (delay) { emitProcessEvent(xhr, "abort"); }
            if (delay && !requestTask) { emitProcessEvent(xhr, "loadend"); }
        });
    }

    timerFn(() => {
        if (s[_resetPending]) {
            if (delay) { s.readyState = XMLHttpRequestP.UNSENT; }
            resetXHR(xhr);
        }
    });
}

function checkRequestTimeout(xhr: XMLHttpRequest) {
    const s = (xhr as XMLHttpRequestP)[state];
    if (s.timeout) {
        s[_timeoutId] = setTimeout(() => {
            if (!s.status && s.readyState !== XMLHttpRequestP.DONE) {
                if (s[_requestTask]) s[_requestTask]!.abort();
                setReadyStateAndNotify(xhr, XMLHttpRequestP.DONE);
                emitProcessEvent(xhr, "timeout");
            }
        }, s.timeout);
    }
}

function resetXHR(xhr: XMLHttpRequest) {
    const s = (xhr as XMLHttpRequestP)[state];

    s[_resetPending] = false;
    resetRequestTimeout(xhr);

    s.response = "";
    s.responseURL = "";
    s.status = 0;
    s.statusText = "";

    s[_requestHeaders] = new HeadersP();
    s[_responseHeaders] = null;
    s[_responseContentLength] = zero;
}

function resetRequestTimeout(xhr: XMLHttpRequest) {
    const s = (xhr as XMLHttpRequestP)[state];
    if (s[_timeoutId]) {
        clearTimeout(s[_timeoutId]);
        s[_timeoutId] = 0;
    }
}

function setReadyStateAndNotify(xhr: XMLHttpRequest, value: number) {
    const s = (xhr as XMLHttpRequestP)[state];

    let hasChanged = value !== s.readyState;
    s.readyState = value;

    if (hasChanged) {
        let evt = createInnerEvent(xhr, "readystatechange");
        EventTarget_fire(xhr, evt);
    }
}

function getHandlers(s: XMLHttpRequestState) {
    return {
        onreadystatechange: (ev: Event) => { executeFn(s.target, s.onreadystatechange, ev); },
    };
}

const responseTypes = ["", "text", "json", "arraybuffer", "blob", "document"];
function normalizeResponseType(responseType: string): XMLHttpRequestResponseType {
    return responseTypes.indexOf(responseType) > -1 ? responseType as XMLHttpRequestResponseType : "";
}

function normalizeDataType(responseType: XMLHttpRequestResponseType) {
    return (responseType === "blob" || responseType === "arraybuffer") ? "arraybuffer" : "text";
}

const zero = () => 0 as const;
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

function statusTextMap(val: number) {
    return statusMessages[val] || "unknown";
}

const XMLHttpRequestE = (typeof XMLHttpRequest !== "undefined" && XMLHttpRequest) || XMLHttpRequestP;
export { XMLHttpRequestE as XMLHttpRequest };
