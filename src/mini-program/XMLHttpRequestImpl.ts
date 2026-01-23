import { HeadersP } from "../HeadersP";
import { Uint8Array_toBase64, encode } from "../BlobP";
import { convert, convertBack } from "../convertor";
import { normalizeMethod } from "../RequestP";
import { EventTarget_fire, attachFn, executeFn } from "../EventTargetP";
import { createInnerEvent } from "../EventP";
import { emitProcessEvent } from "../ProgressEventP";
import type {
    TRequestFunc,
    IRequestOptions,
    IRequestTask,
    IRequestSuccessCallbackBaseResult,
    IRequestFailCallbackResult,
    IAliRequestFailCallbackResult
} from "./request";
import { request } from "./request";
import { polyfill, checkArgsLength, MPException } from "../isPolyfill";
import { createXMLHttpRequestUpload } from "../XMLHttpRequestUploadP";
import { XMLHttpRequestEventTargetP, normalizeResponseType, statusTextMap } from "../XMLHttpRequestEventTargetP";

const mp = { request: request };
export const setRequest = (request: unknown) => { mp.request = request as TRequestFunc; }

/** @internal */ const state = Symbol(/* "XMLHttpRequestState" */);

export class XMLHttpRequestImpl extends XMLHttpRequestEventTargetP implements XMLHttpRequest {
    static get UNSENT(): 0 { return 0; }
    static get OPENED(): 1 { return 1; }
    static get HEADERS_RECEIVED(): 2 { return 2; }
    static get LOADING(): 3 { return 3; }
    static get DONE(): 4 { return 4; }

    constructor() {
        super();
        this[state] = new XMLHttpRequestState(this);
    }

    /** @internal */
    [state]: XMLHttpRequestState;

    get UNSENT(): 0 { return 0; }
    get OPENED(): 1 { return 1; }
    get HEADERS_RECEIVED(): 2 { return 2; }
    get LOADING(): 3 { return 3; }
    get DONE(): 4 { return 4; }

    get readyState() { return this[state].readyState; }
    get response() { return this[state].response; }
    get responseText(): string { return (!this.responseType || this.responseType === "text") ? this.response : ""; }

    get responseType() { return this[state].responseType; }
    set responseType(value) { this[state].responseType = normalizeResponseType(value); }

    get responseURL() { return this[state].responseURL; }
    get responseXML(): Document | null { return null; }
    get status() { return this[state].status; }

    get statusText() {
        if (this.readyState === 0 /* UNSENT */ || this.readyState === 1 /* OPENED */) return "";
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
        const headers = this[state][_responseHeaders];
        if (!headers) return "";

        let result: string[] = [];
        headers.forEach((value, name) => { result.push(`${name}: ${value}\r\n`); });

        return result.join("");
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
        setReadyStateAndNotify(this, 1 /* OPENED */);
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

        if (!s[_inAfterOpenBeforeSend] || s.readyState !== 1 /* OPENED */) {
            throw new MPException("Failed to execute 'send' on 'XMLHttpRequest': The object's state must be OPENED.", "InvalidStateError");
        }

        s[_inAfterOpenBeforeSend] = false;

        const allowsRequestBody = s[_method] !== "GET" && s[_method] !== "HEAD";
        const processHeaders = allowsRequestBody && !s[_requestHeaders].has("Content-Type");
        const processContentLength = allowsRequestBody && !!body;

        let headers = () => { let dict: Record<string, string> = {}; s[_requestHeaders].forEach((value, name) => { dict[name] = value; }); return dict; }
        let contentLength: () => number = () => 0;

        const processHeadersFn = processHeaders ? (v: string) => { s[_requestHeaders].set("Content-Type", v); } : void 0;
        const processContentLengthFn = processContentLength ? (v: () => number) => { contentLength = v; } : void 0;

        let data = body as string | ArrayBuffer;
        try { data = convert(body, false, processHeadersFn, processContentLengthFn); } catch (e) { console.warn(e); }

        let options: IRequestOptions = {
            url: s[_requestURL],
            method: s[_method] as NonNullable<IRequestOptions["method"]>,
            header: headers(),
            data: data !== "" ? data : void 0,
            dataType: s.responseType === "json" ? "json" : normalizeDataType(s.responseType),
            responseType: normalizeDataType(s.responseType),
            withCredentials: s.withCredentials,
            success: requestSuccess.bind(this),
            fail: requestFail.bind(this),
            complete: requestComplete.bind(this),
        };

        // Alipay Mini Program
        options.headers = options.header!;

        s[_requestTask] = mp.request(options);
        emitProcessEvent(this, "loadstart");

        if (processContentLength && s.upload) {
            emitProcessEvent(this.upload, "loadstart", 0, contentLength);
        }

        setTimeout(() => {
            if (s.upload) {
                const _aborted = s[_inAfterOpenBeforeSend] || s.readyState !== 1 /* OPENED */;
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
        if (!s[_inAfterOpenBeforeSend] || s.readyState !== 1 /* OPENED */) {
            throw new MPException("Failed to execute 'setRequestHeader' on 'XMLHttpRequest': The object's state must be OPENED.", "InvalidStateError");
        }

        let _name = "" + name;
        let _value = "" + value;

        try {
            s[_requestHeaders].append(_name, _value);
        } catch (e) {
            throw new SyntaxError(`Failed to execute 'setRequestHeader' on 'XMLHttpRequest': '${_name}' is not a valid HTTP header field name.`);
        }
    }

    get onreadystatechange() { return this[state].onreadystatechange; }
    set onreadystatechange(value) {
        this[state].onreadystatechange = value;
        attachFn(this, "readystatechange", value, this[state][_handlers].onreadystatechange);
    }

    /** @internal */ toString() { return "[object XMLHttpRequest]"; }
    /** @internal */ get [Symbol.toStringTag]() { return "XMLHttpRequest"; }
    /** @internal */ get isPolyfill() { return { symbol: polyfill, hierarchy: ["XMLHttpRequest", "XMLHttpRequestEventTarget", "EventTarget"] }; }
}

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

    readyState: XMLHttpRequest["readyState"] = 0 /* UNSENT */;
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
    [_responseContentLength]: () => number = () => 0;

    [_requestTask]: IRequestTask | null = null;
}

function getHandlers(s: XMLHttpRequestState) {
    return {
        onreadystatechange: (ev: Event) => { executeFn(s.target, s.onreadystatechange, ev); },
    };
}

function normalizeDataType(responseType: XMLHttpRequestResponseType) {
    return (responseType === "blob" || responseType === "arraybuffer") ? "arraybuffer" : "text";
}

function requestSuccess(this: XMLHttpRequest, res: IRequestSuccessCallbackBaseResult) {
    const s = (this as XMLHttpRequestImpl)[state];

    s.responseURL = s[_requestURL];
    s.status = "statusCode" in res ? res.statusCode : "status" in res ? (res as IRequestSuccessCallbackBaseResult).status! : 200;
    s[_responseHeaders] = new HeadersP(("header" in res ? res.header : "headers" in res ? (res as IRequestSuccessCallbackBaseResult).headers! : {}) as Record<string, string>);

    let lengthStr = s[_responseHeaders]!.get("Content-Length");
    s[_responseContentLength] = () => { return lengthStr ? parseInt(lengthStr) : 0; }

    if (s.readyState === 1 /* OPENED */) {
        setReadyStateAndNotify(this, 2 /* HEADERS_RECEIVED */);
        setReadyStateAndNotify(this, 3 /* LOADING */);

        setTimeout(() => {
            if (!s[_inAfterOpenBeforeSend]) {
                let l = s[_responseContentLength];

                try {
                    s.response = convertBack(s.responseType, res.data);
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
    // Alipay Mini Program
    // error: 14 --- JSON parse data error
    // error: 19 --- http status error
    // At this point, the error data object will contain three pieces of information
    // returned from the server: status, headers, and data.
    // In the browser's XMLHttpRequest, these two errors (Error 14 and Error 19)
    // differ from those in Alipay Mini Programs and should instead return normally.
    // Therefore, this scenario is also handled here as a successful request response.
    if (("header" in err && "statusCode" in err) || ("headers" in err && "status" in err)) {
        requestSuccess.call(this, {
            statusCode: "statusCode" in err ? err.statusCode as number : err.status || 0,
            header: "header" in err ? err.header as object : err.headers || {},
            data: "data" in err ? err.data || "" : "",
        });
        return;
    }

    const s = (this as XMLHttpRequestImpl)[state];
    s.status = 0;
    s.statusText = "errMsg" in err ? err.errMsg : "errorMessage" in err ? err.errorMessage : "";

    if (!s[_inAfterOpenBeforeSend] && s.readyState !== 0 /* UNSENT */ && s.readyState !== 4 /* DONE */) {
        emitProcessEvent(this, "error");
        resetRequestTimeout(this);
    }
}

function requestComplete(this: XMLHttpRequest) {
    const s = (this as XMLHttpRequestImpl)[state];
    s[_requestTask] = null;

    if (!s[_inAfterOpenBeforeSend] && (s.readyState === 1 /* OPENED */ || s.readyState === 3 /* LOADING */)) {
        setReadyStateAndNotify(this, 4 /* DONE */);
    }

    setTimeout(() => {
        if (!s[_inAfterOpenBeforeSend]) {
            let l = s[_responseContentLength];
            emitProcessEvent(this, "loadend", l, l);
        }
    });
}

// Alipay Mini Program
function safeAbort(task: IRequestTask) {
    if ("abort" in task && typeof task.abort === "function") {
        task.abort();
    }
}

function clearRequest(xhr: XMLHttpRequest, delay = true) {
    const s = (xhr as XMLHttpRequestImpl)[state];
    const timerFn = delay ? setTimeout : (f: () => void) => { f(); };
    s[_resetPending] = true;

    if (s[_requestTask] && s.readyState !== 4 /* DONE */) {
        if (delay) { setReadyStateAndNotify(xhr, 4 /* DONE */); }

        timerFn(() => {
            const requestTask = s[_requestTask];

            if (requestTask) { safeAbort(requestTask); }
            if (delay) { emitProcessEvent(xhr, "abort"); }
            if (delay && !requestTask) { emitProcessEvent(xhr, "loadend"); }
        });
    }

    timerFn(() => {
        if (s[_resetPending]) {
            if (delay) { s.readyState = 0 /* UNSENT */; }
            resetXHR(xhr);
        }
    });
}

function checkRequestTimeout(xhr: XMLHttpRequest) {
    const s = (xhr as XMLHttpRequestImpl)[state];
    if (s.timeout) {
        s[_timeoutId] = setTimeout(() => {
            if (!s.status && s.readyState !== 4 /* DONE */) {
                if (s[_requestTask]) safeAbort(s[_requestTask]!);
                setReadyStateAndNotify(xhr, 4 /* DONE */);
                emitProcessEvent(xhr, "timeout");
            }
        }, s.timeout);
    }
}

function resetXHR(xhr: XMLHttpRequest) {
    const s = (xhr as XMLHttpRequestImpl)[state];

    s[_resetPending] = false;
    resetRequestTimeout(xhr);

    s.response = "";
    s.responseURL = "";
    s.status = 0;
    s.statusText = "";

    s[_requestHeaders] = new HeadersP();
    s[_responseHeaders] = null;
    s[_responseContentLength] = () => 0;
}

function resetRequestTimeout(xhr: XMLHttpRequest) {
    const s = (xhr as XMLHttpRequestImpl)[state];
    if (s[_timeoutId]) {
        clearTimeout(s[_timeoutId]);
        s[_timeoutId] = 0;
    }
}

function setReadyStateAndNotify(xhr: XMLHttpRequest, value: number) {
    const s = (xhr as XMLHttpRequestImpl)[state];

    let hasChanged = value !== s.readyState;
    s.readyState = value;

    if (hasChanged) {
        let evt = createInnerEvent(xhr, "readystatechange");
        EventTarget_fire(xhr, evt);
    }
}

const XMLHttpRequestE = (typeof XMLHttpRequest !== "undefined" && XMLHttpRequest) || XMLHttpRequestImpl;
export { XMLHttpRequestE as XMLHttpRequest };
