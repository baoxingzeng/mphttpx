import { mp } from "./platform";
import { TextEncoderP } from "./TextEncoderP";
import { TextDecoderP } from "./TextDecoderP";
import { EventP } from "./EventP";
import { ProgressEventP } from "./ProgressEventP";
import { eventTargetState, attachFn, executeFn } from "./EventTargetP";
import { XMLHttpRequestEventTargetP } from "./XMLHttpRequestEventTargetP";
import { XMLHttpRequestUploadP, createXMLHttpRequestUploadP } from "./XMLHttpRequestUploadP";
import { BlobP } from "./BlobP";
import { type FormDataP } from "./FormDataP";
import type {
    IRequestOptions,
    IRequestTask,
    IRequestSuccessCallbackBaseResult,
    IRequestFailCallbackResult,
    IAliRequestFailCallbackResult
} from "./request";
import { request } from "./request";
import { g, state as internalState, polyfill, isObjectType, isPolyfillType, defineStringTag, MPException } from "./isPolyfill";

const state = Symbol("XMLHttpRequestState");
export { state as xhrState };

export class XMLHttpRequestP extends XMLHttpRequestEventTargetP implements XMLHttpRequest {
    static readonly UNSENT = 0;
    static readonly OPENED = 1;
    static readonly HEADERS_RECEIVED = 2;
    static readonly LOADING = 3;
    static readonly DONE = 4;

    constructor() {
        super();
        this[state] = new XMLHttpRequestState(this);
    }

    [state]: XMLHttpRequestState;

    readonly UNSENT = 0;
    readonly OPENED = 1;
    readonly HEADERS_RECEIVED = 2;
    readonly LOADING = 3;
    readonly DONE = 4;

    get readyState() { return this[state].readyState; }
    get response() { return this[state].response; }
    get responseText(): string { return (!this.responseType || this.responseType === "text") ? this.response : ""; }

    get responseType() { return this[state].responseType; }
    set responseType(value) { this[state].responseType = value; }

    get responseURL() { return this[state].responseURL; }
    get responseXML(): Document | null { return null; }
    get status() { return this[state].status; }

    get statusText() {
        if (this.readyState === XMLHttpRequestP.UNSENT || this.readyState === XMLHttpRequestP.OPENED) return "";
        return this[state].statusText || statusTextMap(this.status);
    }

    get timeout() { return this[state].timeout; }
    set timeout(value) { this[state].timeout = value; }

    get upload() { return this[state].upload; }

    get withCredentials() { return this[state].withCredentials; }
    set withCredentials(value) { this[state].withCredentials = value; }

    abort(): void {
        this[state].clearRequest();
    }

    getAllResponseHeaders(): string {
        if (!this[state]._resHeaders) return "";
        return Object.entries(this[state]._resHeaders || {}).map(([k, v]) => `${k}: ${v}\r\n`).join("");
    }

    getResponseHeader(name: string): string | null {
        if (!this[state]._resHeaders) return null;
        return Object.entries(this[state]._resHeaders || {}).find(x => x[0].toLowerCase() === name.toLowerCase())?.[1] ?? null;
    }

    open(...args: [method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null]): void {
        const [method, url, async = true, username = null, password = null] = args;
        if (args.length < 2) {
            throw new TypeError(`Failed to execute 'open' on 'XMLHttpRequest': 2 arguments required, but only ${args.length} present.`);
        }

        if (!async) {
            console.warn("Synchronous XMLHttpRequest is deprecated because of its detrimental effects to the end user's experience.");
        }

        this[state].clearRequest(false);

        this[state]._method = normalizeMethod(method);
        this[state]._reqURL = String(url);

        this[state]._reqCanSend = true;
        this[state].setReadyStateAndNotify(XMLHttpRequestP.OPENED);
    }

    overrideMimeType(mime: string): void { }

    send(body?: Document | XMLHttpRequestBodyInit | null): void {
        if (!this[state]._reqCanSend || this.readyState !== XMLHttpRequestP.OPENED) {
            throw new MPException("Failed to execute 'send' on 'XMLHttpRequest': The object's state must be OPENED.", "InvalidStateError");
        }

        this[state]._reqCanSend = false;

        this[state].execRequest(body);
        this[state].checkRequestTimeout();
    }

    setRequestHeader(name: string, value: string): void {
        assignRequestHeader(this[state]._reqHeaders, name, value);
    }

    get onreadystatechange() { return this[state].onreadystatechange; }
    set onreadystatechange(value) {
        this[state].onreadystatechange = value;
        attachFn.call(this, "readystatechange", value, this[state]._onreadystatechange);
    }

    toString() { return "[object XMLHttpRequest"; }
    get isPolyfill() { return { symbol: polyfill, hierarchy: ["XMLHttpRequest", "XMLHttpRequestEventTarget", "EventTarget"] }; }
}

defineStringTag(XMLHttpRequestP, "XMLHttpRequest");

class XMLHttpRequestState {
    constructor(target: XMLHttpRequestP) {
        this.target = target;
        this.upload = createXMLHttpRequestUploadP();
    }

    target: XMLHttpRequestP;

    readyState = XMLHttpRequestP.UNSENT;
    response: any = "";
    responseType: XMLHttpRequestResponseType = "";
    responseURL = "";
    status = 0;
    statusText = "";
    timeout = 0;
    upload: XMLHttpRequestUploadP;
    withCredentials = false;

    _reqCanSend = false;
    _resetPending = false;
    _timeoutId = 0;

    _reqURL = "";
    _method = "GET";
    _reqHeaders: Record<string, string> = { Accept: "*/*" };
    _resHeaders: Record<string, string> | null = null;
    _resContLen = 0;
    _requestTask: IRequestTask | null = null;

    execRequest(body?: Document | XMLHttpRequestBodyInit | null) {
        const allowsRequestBody = !["GET", "HEAD"].includes(this._method);
        const contentTypeExists = Object.keys(this._reqHeaders).map(x => x.toLowerCase()).includes("Content-Type".toLowerCase());
        const processHeaders = allowsRequestBody && !contentTypeExists;
        const processContentLength = this.upload[eventTargetState].executors.length > 0;

        let headers = { ...this._reqHeaders };
        let contentLength = 0;

        let data: IRequestOptions["data"] = convert(
            body,
            processHeaders ? v => { headers["Content-Type"] = v } : void 0,
            processContentLength ? v => { contentLength = v; } : void 0,
        );

        this._requestTask = request({
            url: this._reqURL,
            method: this._method as NonNullable<IRequestOptions["method"]>,
            header: headers,
            data,
            dataType: this.responseType === "json" ? "json" : "text",
            responseType: this.responseType === "arraybuffer" ? "arraybuffer" : "text",
            success: this.requestSuccess.bind(this),
            fail: this.requestFail.bind(this),
            complete: this.requestComplete.bind(this),
        });

        this.emitProcessEvent("loadstart");

        if (processContentLength) {
            const hasRequestBody = allowsRequestBody && contentLength > 0;

            if (hasRequestBody) {
                this.emitProcessEvent("loadstart", 0, contentLength, this.upload);
            }

            setTimeout(() => {
                const _aborted = this._reqCanSend || this.readyState !== XMLHttpRequestP.OPENED;
                const _contentLength = _aborted ? 0 : contentLength;

                if (_aborted) {
                    this.emitProcessEvent("abort", 0, 0, this.upload);
                } else {
                    if (hasRequestBody) {
                        this.emitProcessEvent("load", _contentLength, _contentLength, this.upload);
                    }
                }

                if (_aborted || hasRequestBody) {
                    this.emitProcessEvent("loadend", _contentLength, _contentLength, this.upload);
                }
            });
        }
    }

    requestSuccess({ statusCode, header, data }: IRequestSuccessCallbackBaseResult) {
        this.responseURL = this._reqURL;
        this.status = statusCode;
        this._resHeaders = header as Record<string, string>;
        this._resContLen = parseInt(this.target.getResponseHeader("Content-Length") || "0");

        if (this.readyState === XMLHttpRequestP.OPENED) {
            this.setReadyStateAndNotify(XMLHttpRequestP.HEADERS_RECEIVED);
            this.setReadyStateAndNotify(XMLHttpRequestP.LOADING);

            setTimeout(() => {
                if (!this._reqCanSend) {
                    let l = this._resContLen;

                    try {
                        this.response = convertBack(this.responseType, data);
                        this.emitProcessEvent("load", l, l);
                    } catch (e) {
                        console.error(e);
                        this.emitProcessEvent("error");
                    }
                }
            });
        }
    }

    requestFail(err: IRequestFailCallbackResult | IAliRequestFailCallbackResult) {
        // Alipay Mini Programs
        // error: 14 --- JSON parse data error
        // error: 19 --- http status error
        // At this point, the error data object will contain three pieces of information
        // returned from the server: status, headers, and data.
        // In the browser's XMLHttpRequest, these two errors (Error 14 and Error 19)
        // differ from those in Alipay Mini Programs and should instead return normally.
        // Therefore, this scenario is also handled here as a successful request response.
        if ("status" in err) {
            this.requestSuccess({ statusCode: err.status!, header: err.headers!, data: err.data! });
            return;
        }

        this.status = 0;
        this.statusText = "errMsg" in err ? err.errMsg : "errorMessage" in err ? err.errorMessage : "";

        if (!this._reqCanSend && this.readyState !== XMLHttpRequestP.UNSENT && this.readyState !== XMLHttpRequestP.DONE) {
            this.emitProcessEvent("error");
            this.resetRequestTimeout();
        }
    }

    requestComplete() {
        this._requestTask = null;

        if (!this._reqCanSend && (this.readyState === XMLHttpRequestP.OPENED || this.readyState === XMLHttpRequestP.LOADING)) {
            this.setReadyStateAndNotify(XMLHttpRequestP.DONE);
        }

        setTimeout(() => {
            if (!this._reqCanSend) {
                let l = this._resContLen;
                this.emitProcessEvent("loadend", l, l);
            }
        });
    }

    clearRequest(delay = true) {
        const timerFn = delay ? setTimeout : (f: () => void) => { f(); };
        this._resetPending = true;

        if (this._requestTask && this.readyState !== XMLHttpRequestP.DONE) {
            if (delay) { this.setReadyStateAndNotify(XMLHttpRequestP.DONE); }

            timerFn(() => {
                const requestTask = this._requestTask;

                if (requestTask) { requestTask.abort(); }
                if (delay) { this.emitProcessEvent("abort"); }
                if (delay && !requestTask) { this.emitProcessEvent("loadend"); }
            });
        }

        timerFn(() => {
            if (this._resetPending) {
                if (delay) { this.readyState = XMLHttpRequestP.UNSENT; }
                this.resetXHR();
            }
        });
    }

    checkRequestTimeout() {
        if (this.timeout) {
            this._timeoutId = setTimeout(() => {
                if (!this.status && this.readyState !== XMLHttpRequestP.DONE) {
                    if (this._requestTask) this._requestTask.abort();
                    this.setReadyStateAndNotify(XMLHttpRequestP.DONE);
                    this.emitProcessEvent("timeout");
                }
            }, this.timeout);
        }
    }

    resetXHR() {
        this._resetPending = false;
        this.resetRequestTimeout();

        this.response = "";
        this.responseURL = "";
        this.status = 0;
        this.statusText = "";

        this._reqHeaders = {};
        this._resHeaders = null;
        this._resContLen = 0;
    }

    resetRequestTimeout() {
        if (this._timeoutId) {
            clearTimeout(this._timeoutId);
            this._timeoutId = 0;
        }
    }

    emitProcessEvent(type: string, loaded = 0, total = 0, target?: XMLHttpRequestEventTargetP) {
        const _target = target ?? this.target;
        const _event = new ProgressEventP(type, {
            lengthComputable: total > 0,
            loaded,
            total,
        });

        _event[internalState].target = _target;
        _event[internalState].isTrusted = true;
        _target[eventTargetState].fire(_event);
    }

    setReadyStateAndNotify(value: number) {
        const hasChanged = value !== this.readyState;
        this.readyState = value;

        if (hasChanged) {
            const evt = new EventP("readystatechange");
            evt[internalState].target = this.target;
            evt[internalState].isTrusted = true;

            this.target[eventTargetState].fire(evt);
        }
    }

    onreadystatechange: ((this: XMLHttpRequest, ev: Event) => any) | null = null;
    _onreadystatechange = (ev: Event) => { executeFn.call(this.target, this.onreadystatechange, ev); }
}

// HTTP methods whose capitalization should be normalized
const methods = ["CONNECT", "DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT", "TRACE"];

export function normalizeMethod(method: string) {
    let upcased = method.toUpperCase();
    return methods.indexOf(upcased) > -1 ? upcased : method;
}

function assignRequestHeader(headers: Record<string, string>, name: string, value: string) {
    for (const key of Object.keys(headers)) {
        if (key.toLowerCase() === name.toLowerCase()) {
            headers[key] = value;
            return;
        }
    }

    Object.assign(headers, { [name]: value });
    return;
}

const encode = (str: string) => {
    const encoder = new TextEncoderP();
    return encoder.encode(str).buffer;
}

const decode = (buf: ArrayBuffer) => {
    let decoder = new TextDecoderP();
    return decoder.decode(buf);
}

export function convert(
    body?: Parameters<XMLHttpRequest["send"]>[0],
    setContentType?: (str: string) => void,
    setContentLength?: (num: number) => void,
): string | ArrayBuffer {
    let result: string | ArrayBuffer;

    if (typeof body === "string") {
        result = body;

        if (setContentType) {
            setContentType("text/plain;charset=UTF-8");
        }
    }

    else if (isObjectType<URLSearchParams>("URLSearchParams", body)) {
        result = body.toString();

        if (setContentType) {
            setContentType("application/x-www-form-urlencoded;charset=UTF-8")
        }
    }

    else if (body instanceof ArrayBuffer) {
        result = body.slice(0);
    }

    else if (ArrayBuffer.isView(body)) {
        result = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength);
    }

    else if (isPolyfillType<Blob>("Blob", body)) {
        result = (body as BlobP)[internalState]._u8array.buffer.slice(0);

        if (setContentType && body.type) {
            setContentType(body.type);
        }
    }

    else if (isPolyfillType<FormData>("FormData", body)) {
        const blob = (body as FormDataP)[internalState].toBlob();
        result = (blob as BlobP)[internalState]._u8array.buffer;

        if (setContentType) {
            setContentType(blob.type);
        }
    }

    else if (!body) {
        result = "";
    }

    else {
        result = String(body);
    }

    if (setContentLength) {
        setContentLength((typeof result === "string" ? encode(result) : result).byteLength);
    }

    return result;
}

export function convertBack(
    type: XMLHttpRequestResponseType,
    data?: IRequestSuccessCallbackBaseResult["data"]
): string | object | ArrayBuffer | Blob {
    let temp = !!data ? (typeof data !== "string" && !(data instanceof ArrayBuffer) ? JSON.stringify(data) : data) : "";

    if (!type || type === "text") {
        return typeof temp === "string" ? temp : decode(temp);
    }

    else if (type === "json") {
        return JSON.parse(typeof temp === "string" ? temp : decode(temp));
    }

    else if (type === "arraybuffer") {
        return temp instanceof ArrayBuffer ? temp.slice(0) : encode(temp);
    }

    else if (type === "blob") {
        return new BlobP([temp]);
    }

    else {
        return temp;
    }
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

function statusTextMap(val: number) {
    return statusMessages[val] || "unknown";
}

const XMLHttpRequestE = !mp ? g["XMLHttpRequest"] : XMLHttpRequestP;
export { XMLHttpRequestE as XMLHttpRequest };
