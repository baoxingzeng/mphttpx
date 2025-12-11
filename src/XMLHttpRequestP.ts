import { TextEncoderP } from "./TextEncoderP";
import { TextDecoderP } from "./TextDecoderP";
import { createInnerEvent } from "./EventP";
import { emitProcessEvent } from "./ProgressEventP";
import { eventTargetState, _executors, fire, attachFn, executeFn } from "./EventTargetP";
import { XMLHttpRequestEventTargetP } from "./XMLHttpRequestEventTargetP";
import { XMLHttpRequestUploadP, createXMLHttpRequestUploadP } from "./XMLHttpRequestUploadP";
import { BlobP, blobState, u8array2base64 } from "./BlobP";
import { type FormDataP, formDataState } from "./FormDataP";
import type {
    IRequestOptions,
    IRequestTask,
    IRequestSuccessCallbackBaseResult,
    IRequestFailCallbackResult,
    IAliRequestFailCallbackResult
} from "./request";
import { request } from "./request";
import { polyfill, isObjectType, isPolyfillType, defineStringTag, MPException, objectEntries } from "./isPolyfill";

const state = Symbol(/* "XMLHttpRequestState" */);
export { state as xhrState };

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

    get upload(): XMLHttpRequestUpload {
        const that = this[state];
        if (!that.upload) { that.upload = createXMLHttpRequestUploadP(); }
        return that.upload!;
    }

    get withCredentials() { return this[state].withCredentials; }
    set withCredentials(value) { this[state].withCredentials = value; }

    abort(): void {
        clearRequest.call(this[state]);
    }

    getAllResponseHeaders(): string {
        if (!this[state][_responseHeaders]) return "";
        return objectEntries(this[state][_responseHeaders] || {}).map(([k, v]) => `${k}: ${v}\r\n`).join("");
    }

    getResponseHeader(name: string): string | null {
        if (!this[state][_responseHeaders]) return null;

        let nameKey = name.toLowerCase();
        return objectEntries(this[state][_responseHeaders] || {}).find(x => x[0].toLowerCase() === nameKey)?.[1] ?? null;
    }

    open(...args: [method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null]): void {
        const [method, url, async = true, username = null, password = null] = args;
        const that = this[state];

        if (args.length < 2) {
            throw new TypeError(`Failed to execute 'open' on 'XMLHttpRequest': 2 arguments required, but only ${args.length} present.`);
        }

        if (!async) {
            console.warn("Synchronous XMLHttpRequest is not supported because of its detrimental effects to the end user's experience.");
        }

        clearRequest.call(that, false);

        that[_method] = normalizeMethod(method);
        that[_requestURL] = String(url);

        if (username !== null || password !== null) {
            let _username = String(username ?? "");
            let _password = String(password ?? "");

            if (_username.length > 0 || _password.length > 0) {
                let auth = `Basic ${u8array2base64((new TextEncoderP()).encode(_username + ":" + _password))}`;
                this.setRequestHeader("Authorization", auth);
            }
        }

        that[_inAfterOpenBeforeSend] = true;
        setReadyStateAndNotify.call(that, XMLHttpRequestP.OPENED);
    }

    overrideMimeType(mime: string): void {
        if (this[state][_inAfterOpenBeforeSend]) {
            console.warn(`XMLHttpRequest.overrideMimeType('${mime}') is not implemented: The method will have no effect on response parsing.`);
        }
    }

    send(body?: Document | XMLHttpRequestBodyInit | null): void {
        const that = this[state];

        if (!that[_inAfterOpenBeforeSend] || that.readyState !== XMLHttpRequestP.OPENED) {
            throw new MPException("Failed to execute 'send' on 'XMLHttpRequest': The object's state must be OPENED.", "InvalidStateError");
        }

        that[_inAfterOpenBeforeSend] = false;

        const allowsRequestBody = that[_method] !== "GET" && that[_method] !== "HEAD";
        const processHeaders = allowsRequestBody && Object.keys(that[_requestHeaders]).map(x => x.toLowerCase()).indexOf("content-type") === -1;

        const upload = that.upload;
        const processContentLength = upload && upload[eventTargetState][_executors].length > 0;

        let headers = processHeaders ? { ...that[_requestHeaders] } : that[_requestHeaders];
        let contentLength: number | (() => number) = zero;

        let data = convert(
            body,
            processHeaders ? v => { assignRequestHeader(headers, "Content-Type", v); } : void 0,
            processContentLength ? v => { contentLength = v; } : void 0,
        );

        let options: IRequestOptions = {
            url: that[_requestURL],
            method: that[_method] as NonNullable<IRequestOptions["method"]>,
            header: headers,
            data,
            dataType: that.responseType === "json" ? "json" : normalizeDataType(that.responseType),
            responseType: normalizeDataType(that.responseType),
            success: requestSuccess.bind(that),
            fail: requestFail.bind(that),
            complete: requestComplete.bind(that),
        };

        if (that.withCredentials) {
            options.withCredentials = true;
            options.enableCookie = true;
        }

        that[_requestTask] = request(options);
        emitProcessEvent(this, "loadstart");

        if (processContentLength) {
            const hasRequestBody = allowsRequestBody && (typeof data === "string" ? data.length > 0 : data.byteLength > 0);

            if (hasRequestBody) {
                emitProcessEvent(upload, "loadstart", 0, contentLength);
            }

            setTimeout(() => {
                const _aborted = that[_inAfterOpenBeforeSend] || that.readyState !== XMLHttpRequestP.OPENED;
                const _contentLength = _aborted ? 0 : contentLength;

                if (_aborted) {
                    emitProcessEvent(upload, "abort");
                } else {
                    if (hasRequestBody) {
                        emitProcessEvent(upload, "load", _contentLength, _contentLength);
                    }
                }

                if (_aborted || hasRequestBody) {
                    emitProcessEvent(upload, "loadend", _contentLength, _contentLength);
                }
            });
        }

        checkRequestTimeout.call(that);
    }

    setRequestHeader(name: string, value: string): void {
        assignRequestHeader(this[state][_requestHeaders], name, value);
    }

    get onreadystatechange() { return this[state].onreadystatechange; }
    set onreadystatechange(value) {
        this[state].onreadystatechange = value;
        attachFn.call(this, "readystatechange", value, this[state][_handlers].onreadystatechange);
    }

    toString() { return "[object XMLHttpRequest]"; }
    get isPolyfill() { return { symbol: polyfill, hierarchy: ["XMLHttpRequest", "XMLHttpRequestEventTarget", "EventTarget"] }; }
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

defineStringTag(XMLHttpRequestP, "XMLHttpRequest");

const _handlers = Symbol();

const _inAfterOpenBeforeSend = Symbol();
const _resetPending = Symbol();
const _timeoutId = Symbol();

const _requestURL = Symbol();
const _method = Symbol();
const _requestHeaders = Symbol();
export const _responseHeaders = Symbol();
const _responseContentLength = Symbol();

const _requestTask = Symbol();

class XMLHttpRequestState {
    constructor(target: XMLHttpRequestP) {
        this.target = target;
    }

    target: XMLHttpRequestP;

    readyState: XMLHttpRequest["readyState"] = XMLHttpRequestP.UNSENT;
    response: any = "";
    responseType: XMLHttpRequestResponseType = "";
    responseURL = "";
    status = 0;
    statusText = "";
    timeout = 0;
    upload?: XMLHttpRequestUploadP;
    withCredentials = false;

    [_handlers] = getHandlers.call(this);
    onreadystatechange: ((this: XMLHttpRequest, ev: Event) => any) | null = null;

    [_inAfterOpenBeforeSend] = false;
    [_resetPending] = false;
    [_timeoutId] = 0;

    [_requestURL] = "";
    [_method] = "GET";
    [_requestHeaders]: Record<string, string> = { Accept: "*/*" };
    [_responseHeaders]: Record<string, string> | null = null;
    [_responseContentLength]: number | (() => number) = zero;

    [_requestTask]: IRequestTask | null = null;
}

function requestSuccess(this: XMLHttpRequestState, { statusCode, header, data }: IRequestSuccessCallbackBaseResult) {
    this.responseURL = this[_requestURL];
    this.status = statusCode;
    this[_responseHeaders] = header as Record<string, string>;

    let lengthStr = this.target.getResponseHeader("Content-Length");
    this[_responseContentLength] = () => { return lengthStr ? parseInt(lengthStr) : 0; }

    if (this.readyState === XMLHttpRequestP.OPENED) {
        setReadyStateAndNotify.call(this, XMLHttpRequestP.HEADERS_RECEIVED);
        setReadyStateAndNotify.call(this, XMLHttpRequestP.LOADING);

        setTimeout(() => {
            if (!this[_inAfterOpenBeforeSend]) {
                let l = this[_responseContentLength];

                try {
                    this.response = convertBack(this.responseType, data);
                    emitProcessEvent(this.target, "load", l, l);
                } catch (e) {
                    console.error(e);
                    emitProcessEvent(this.target, "error");
                }
            }
        });
    }
}

function requestFail(this: XMLHttpRequestState, err: IRequestFailCallbackResult | IAliRequestFailCallbackResult) {
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

    this.status = 0;
    this.statusText = "errMsg" in err ? err.errMsg : "errorMessage" in err ? err.errorMessage : "";

    if (!this[_inAfterOpenBeforeSend] && this.readyState !== XMLHttpRequestP.UNSENT && this.readyState !== XMLHttpRequestP.DONE) {
        emitProcessEvent(this.target, "error");
        resetRequestTimeout.call(this);
    }
}

function requestComplete(this: XMLHttpRequestState) {
    this[_requestTask] = null;

    if (!this[_inAfterOpenBeforeSend] && (this.readyState === XMLHttpRequestP.OPENED || this.readyState === XMLHttpRequestP.LOADING)) {
        setReadyStateAndNotify.call(this, XMLHttpRequestP.DONE);
    }

    setTimeout(() => {
        if (!this[_inAfterOpenBeforeSend]) {
            let l = this[_responseContentLength];
            emitProcessEvent(this.target, "loadend", l, l);
        }
    });
}

function clearRequest(this: XMLHttpRequestState, delay = true) {
    const timerFn = delay ? setTimeout : (f: () => void) => { f(); };
    this[_resetPending] = true;

    if (this[_requestTask] && this.readyState !== XMLHttpRequestP.DONE) {
        if (delay) { setReadyStateAndNotify.call(this, XMLHttpRequestP.DONE); }

        timerFn(() => {
            const requestTask = this[_requestTask];

            if (requestTask) { requestTask.abort(); }
            if (delay) { emitProcessEvent(this.target, "abort"); }
            if (delay && !requestTask) { emitProcessEvent(this.target, "loadend"); }
        });
    }

    timerFn(() => {
        if (this[_resetPending]) {
            if (delay) { this.readyState = XMLHttpRequestP.UNSENT; }
            resetXHR.call(this);
        }
    });
}

function checkRequestTimeout(this: XMLHttpRequestState) {
    if (this.timeout) {
        this[_timeoutId] = setTimeout(() => {
            if (!this.status && this.readyState !== XMLHttpRequestP.DONE) {
                if (this[_requestTask]) this[_requestTask]!.abort();
                setReadyStateAndNotify.call(this, XMLHttpRequestP.DONE);
                emitProcessEvent(this.target, "timeout");
            }
        }, this.timeout);
    }
}

function resetXHR(this: XMLHttpRequestState) {
    this[_resetPending] = false;
    resetRequestTimeout.call(this);

    this.response = "";
    this.responseURL = "";
    this.status = 0;
    this.statusText = "";

    this[_requestHeaders] = {};
    this[_responseHeaders] = null;
    this[_responseContentLength] = zero;
}

function resetRequestTimeout(this: XMLHttpRequestState) {
    if (this[_timeoutId]) {
        clearTimeout(this[_timeoutId]);
        this[_timeoutId] = 0;
    }
}

function setReadyStateAndNotify(this: XMLHttpRequestState, value: number) {
    let hasChanged = value !== this.readyState;
    this.readyState = value;

    if (hasChanged) {
        let evt = createInnerEvent(this.target, "readystatechange");
        fire.call(this.target[eventTargetState], evt);
    }
}

function getHandlers(this: XMLHttpRequestState) {
    return {
        onreadystatechange: (ev: Event) => { executeFn.call(this.target, this.onreadystatechange, ev); },
    };
}

// HTTP methods whose capitalization should be normalized
const methods = ["CONNECT", "DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT", "TRACE"];

export function normalizeMethod(method: string) {
    let upcased = method.toUpperCase();
    return methods.indexOf(upcased) > -1 ? upcased : method;
}

function normalizeDataType(responseType: XMLHttpRequestResponseType) {
    return (responseType === "blob" || responseType === "arraybuffer") ? "arraybuffer" : "text";
}

function assignRequestHeader(headers: Record<string, string>, name: string, value: string) {
    let nameKey = name.toLowerCase();

    for (let key of Object.keys(headers)) {
        if (key.toLowerCase() === nameKey) {
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
    setContentLength?: (num: number | (() => number)) => void,
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
            setContentType("application/x-www-form-urlencoded;charset=UTF-8");
        }
    }

    else if (body instanceof ArrayBuffer) {
        result = body.slice(0);
    }

    else if (ArrayBuffer.isView(body)) {
        result = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength);
    }

    else if (isPolyfillType<Blob>("Blob", body)) {
        result = (body as BlobP)[blobState].toArrayBuffer().slice(0);

        if (setContentType && body.type) {
            setContentType(body.type);
        }
    }

    else if (isPolyfillType<FormData>("FormData", body)) {
        let blob = (body as FormDataP)[formDataState].toBlob();
        result = blob[blobState].toArrayBuffer();

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
        setContentLength(() => {
            return (typeof result === "string" ? encode(result) : result).byteLength;
        });
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
