import { BlobP } from "../file-system/BlobP";
import { HeadersP } from "../fetch-api/HeadersP";
import { encode } from "../helpers/encode";
import { decode } from "../helpers/decode";
import { Payload } from "../helpers/Payload";
import { isArrayBuffer } from "../helpers/isArrayBuffer";
import { statusTextMap } from "../helpers/statusTextMap";
import { Uint8Array_toBase64 } from "../helpers/toBase64";
import { attachFn, executeFn } from "../helpers/handlers";
import { normalizeMethod } from "../helpers/normalizeMethod";
import { emitEvent } from "../helpers/emitEvent";
import { emitProgressEvent } from "../helpers/emitProgressEvent";
import type {
    TRequestFunc,
    IRequestOptions,
    IRequestTask,
    IRequestSuccessCallbackBaseResult,
    IRequestFailCallbackResult,
    IAliRequestFailCallbackResult
} from "./request";
import { getRequest } from "./request";
import { SymbolP, DOMExceptionP, setState, checkArgsLength } from "../utils";
import { createXMLHttpRequestUpload } from "../network/XMLHttpRequestUploadP";
import { XMLHttpRequestEventTargetP } from "../network/XMLHttpRequestEventTargetP";

const enum XHRCycle {
    UNSET,
    OPENED,
    LOADSTART,
    UPLOAD_LOADSTART,
    UPLOAD_LOAD,
    UPLOAD_ABORT,
    UPLOAD_ERROR,
    UPLOAD_TIMEOUT,
    UPLOAD_LOADEND,
    HEADERS_RECEIVED,
    LOADING,
    DONE,
    LOAD,
    ABORT,
    ERROR,
    TIMEOUT,
    LOADEND
};

const mp = { request: getRequest() };
export function setRequest(request: unknown) { mp.request = request as TRequestFunc; }

export class XMLHttpRequestImpl extends XMLHttpRequestEventTargetP implements XMLHttpRequest {
    static get UNSENT(): 0 { return 0; }
    static get OPENED(): 1 { return 1; }
    static get HEADERS_RECEIVED(): 2 { return 2; }
    static get LOADING(): 3 { return 3; }
    static get DONE(): 4 { return 4; }

    constructor() {
        super();
        setState(this, "__XMLHttpRequest__", new XMLHttpRequestState(this));
    }

    /** @internal */ declare readonly __XMLHttpRequest__: XMLHttpRequestState;

    get UNSENT(): 0 { return 0; }
    get OPENED(): 1 { return 1; }
    get HEADERS_RECEIVED(): 2 { return 2; }
    get LOADING(): 3 { return 3; }
    get DONE(): 4 { return 4; }

    get readyState() { return state(this).readyState; }
    get response() { return state(this).response; }
    get responseText() { return state(this).responseText; }
    get responseType() { return state(this).responseType; }
    set responseType(value) {
        if (state(this).pos > XHRCycle.HEADERS_RECEIVED) {
            throw new DOMExceptionP("Failed to set the 'responseType' property on 'XMLHttpRequest': The response type cannot be set if the object's state is LOADING or DONE.", "InvalidStateError");
        }
        if (responseTypes.indexOf(value) > -1) { state(this).responseType = value; }
    }
    get responseURL() { return state(this).responseURL; }
    get responseXML(): Document | null { return null; }
    get status() { return state(this).status; }
    get statusText() {
        if (state(this).pos < XHRCycle.HEADERS_RECEIVED) return "";
        return state(this).statusText || statusTextMap[this.status] || "unknown";
    }
    get timeout() { return state(this).timeout; }
    set timeout(value) { state(this).timeout = value >= 0 ? value : 0; }
    get upload() {
        if (!state(this).upload) { state(this).upload = createXMLHttpRequestUpload(); }
        return state(this).upload!;
    }
    get withCredentials() { return state(this).withCredentials; }
    set withCredentials(value) {
        if (state(this).pos < XHRCycle.LOADSTART) { state(this).withCredentials = !!value; }
        else { throw new TypeError("Failed to set the 'withCredentials' property on 'XMLHttpRequest': The value may only be set if the object's state is UNSENT or OPENED."); }
    }

    abort(): void {
        const requestTask = state(this).requestTask;
        clearRequest(state(this));

        switch (state(this).pos) {
            case XHRCycle.OPENED:
                state(this).requestHeaders = new HeadersP();
                break;

            case XHRCycle.LOADSTART:
            case XHRCycle.UPLOAD_LOADSTART:
                execUploadAbort(this);
                execUnset(this);
                break;

            case XHRCycle.UPLOAD_LOAD:
            case XHRCycle.UPLOAD_LOADEND:
            case XHRCycle.HEADERS_RECEIVED:
            case XHRCycle.LOADING:
                execAbort(this);

            case XHRCycle.DONE:
                execUnset(this);
                break;
        }

        safeAbort(requestTask);
    }

    getAllResponseHeaders(): string {
        const headers = state(this).responseHeaders; if (!headers) return "";
        let result: string[] = []; headers.forEach((value, name) => { result.push(`${name}: ${value}\r\n`); });
        return result.join("");
    }

    getResponseHeader(name: string): string | null {
        checkArgsLength(arguments.length, 1, "XMLHttpRequest", "getResponseHeader");
        if (!state(this).responseHeaders) return null;
        return state(this).responseHeaders!.get(name);
    }

    open(method: string, url: string | URL, async = true, username: string | null = null, password: string | null = null): void {
        checkArgsLength(arguments.length, 2, "XMLHttpRequest", "open");
        if (!async) { console.warn("Synchronous XMLHttpRequest is not supported because of its detrimental effects to the end user's experience."); }

        let _method = normalizeMethod(method);
        let _url = "" + url;
        let _username = "" + (username ?? "");
        let _password = "" + (password ?? "");

        const s = state(this);
        clearRequest(s);

        s.method = _method;
        s.requestURL = _url;
        s.requestHeaders = new HeadersP();

        if (_username.length > 0 || _password.length > 0) {
            let auth = `Basic ${Uint8Array_toBase64(encode(_username + ":" + _password))}`;
            this.setRequestHeader("Authorization", auth);
        }

        execOpened(this);
    }

    overrideMimeType(mime: string): void {
        checkArgsLength(arguments.length, 1, "XMLHttpRequest", "overrideMimeType");
        if (state(this).pos === XHRCycle.OPENED) {
            console.error(`TypeError: Failed to execute 'overrideMimeType' on 'XMLHttpRequest': mimeType ('${mime}') not implemented.`);
        }
    }

    send(body?: Document | XMLHttpRequestBodyInit | null): void {
        const s = state(this);
        const requestId = s.requestId;

        if (s.pos !== XHRCycle.OPENED) {
            throw new DOMExceptionP("Failed to execute 'send' on 'XMLHttpRequest': The object's state must be OPENED.", "InvalidStateError");
        }

        const options: IRequestOptions = {
            url: s.requestURL,
            method: s.method as NonNullable<IRequestOptions["method"]>,
            header: Headers_toDict(s.requestHeaders!),
            dataType: this.responseType === "json" ? "json" : normalizeDataType(this.responseType),
            responseType: normalizeDataType(this.responseType),
            withCredentials: this.withCredentials,
            success: requestSuccess.bind(this, requestId),
            fail: requestFail.bind(this, requestId),
        };

        const payload = (s.method !== "GET" && s.method !== "HEAD" && body !== null && body !== undefined) && new Payload(body as XMLHttpRequestBodyInit);
        if (payload && payload.type && !s.requestHeaders!.has("Content-Type")) { (options.header as Record<string, string>)["Content-Type"] = payload.type; }

        const request = (function (data?: string | ArrayBuffer) {
            if (requestId !== s.requestId) return;
            if (s.pos !== XHRCycle.LOADSTART && s.pos !== XHRCycle.UPLOAD_LOADEND) return;
            options.data = data !== "" ? data : undefined;
            options.headers = options.header!; // Alipay Mini Program
            s.requestTask = mp.request(options);
        }).bind(this);

        checkRequestTimeout(this);
        const task = execLoadstart(this, payload || undefined);

        if (!task) request();
        else task.then(data => { if (data !== undefined) request(data); });
    }

    setRequestHeader(name: string, value: string): void {
        checkArgsLength(arguments.length, 2, "XMLHttpRequest", "setRequestHeader");

        if (state(this).pos !== XHRCycle.OPENED) {
            throw new DOMExceptionP("Failed to execute 'setRequestHeader' on 'XMLHttpRequest': The object's state must be OPENED.", "InvalidStateError");
        }

        let _name = "" + name;
        let _value = "" + value;

        try {
            state(this).requestHeaders!.append(_name, _value);
        } catch (e) {
            throw new SyntaxError(`Failed to execute 'setRequestHeader' on 'XMLHttpRequest': '${_name}' is not a valid HTTP header field name.`);
        }
    }

    get onreadystatechange() { return state(this).onreadystatechange; }
    set onreadystatechange(value) { state(this).onreadystatechange = value; state(this).attach("readystatechange"); }

    /** @internal */ toString() { return "[object XMLHttpRequest]"; }
    /** @internal */ get [SymbolP.toStringTag]() { return "XMLHttpRequest"; }
    /** @internal */ get __MPHTTPX__() { return { chain: ["XMLHttpRequest", "XMLHttpRequestEventTarget", "EventTarget"] }; }
}

class XMLHttpRequestState {
    constructor(target: XMLHttpRequest) {
        this.attach = attachFn<XMLHttpRequest, "readystatechange">(target, getHandlers(target));
    }

    pos: XHRCycle = XHRCycle.UNSET;

    readyState = 0 /* UNSENT */;
    response: any = "";
    responseText = "";
    responseType: XMLHttpRequestResponseType = "";
    responseURL = "";
    status = 0;
    statusText = "";
    timeout = 0;
    upload?: XMLHttpRequestUpload;
    withCredentials = false;

    method = "GET";
    requestURL = "";
    requestHeaders: HeadersP | null = null;
    responseHeaders: HeadersP | null = null;

    timeoutId = 0;
    requestId = 0;
    requestTask: IRequestTask | null = null;

    attach: (type: "readystatechange") => void;
    onreadystatechange: ((this: XMLHttpRequest, ev: Event) => any) | null = null;
}

function getHandlers(t: XMLHttpRequest) {
    return {
        onreadystatechange: (ev: Event) => { executeFn(t, t.onreadystatechange, ev); },
    };
}

function state(target: XMLHttpRequestImpl) {
    return target.__XMLHttpRequest__;
}

function Headers_toDict(headers: Headers) {
    let dict: Record<string, string> = {};
    headers.forEach((value, name) => { dict[name] = value; });
    return dict;
}

const responseTypes = ["", "arraybuffer", "blob", "document", "json", "text"];

function normalizeDataType(responseType: XMLHttpRequestResponseType) {
    return (responseType === "blob" || responseType === "arraybuffer") ? "arraybuffer" : "text";
}

function clearRequest(state: XMLHttpRequestState) {
    state.requestTask = null;
    clearRequestTimeout(state);

    state.response = "";
    state.responseText = "";
    state.responseURL = "";
    state.status = 0;
    state.statusText = "";
    state.requestHeaders = null;
    state.responseHeaders = null;
}

function clearRequestTimeout(state: XMLHttpRequestState) {
    if (state.timeoutId) {
        clearTimeout(state.timeoutId);
        state.timeoutId = 0;
    }
}

function checkRequestTimeout(xhr: XMLHttpRequestImpl) {
    const whenTimeout = () => {
        const requestTask = state(xhr).requestTask;

        switch (state(xhr).pos) {
            case XHRCycle.LOADSTART:
            case XHRCycle.UPLOAD_LOADSTART:
                execUploadTimeout(xhr);
                break;

            case XHRCycle.UPLOAD_LOADEND:
                execTimeout(xhr);
                break;
        }

        safeAbort(requestTask);
    }

    if (xhr.timeout) {
        state(xhr).timeoutId = setTimeout(whenTimeout, xhr.timeout);
    }
}

function requestSuccess(this: XMLHttpRequestImpl, requestId: number, res: IRequestSuccessCallbackBaseResult) {
    if (requestId !== state(this).requestId) return;
    execHeadersReceived(this, res);
}

function requestFail(this: XMLHttpRequestImpl, requestId: number, err: IRequestFailCallbackResult | IAliRequestFailCallbackResult) {
    if (requestId !== state(this).requestId) return;

    // Alipay Mini Program
    if (("header" in err && "statusCode" in err) || ("headers" in err && "status" in err)) {
        return requestSuccess.call(this, requestId, {
            statusCode: "statusCode" in err ? err.statusCode as number : err.status || 0,
            header: "header" in err ? err.header as object : err.headers || {},
            data: "data" in err ? err.data || "" : "",
        });
    }

    execError(this, err);
}

function setReadyStateAndNotify(xhr: XMLHttpRequestImpl, value: number) {
    if (xhr.readyState !== value) {
        state(xhr).readyState = value;
        emitEvent(xhr, "readystatechange");
    }
}

function getResponse(type: XMLHttpRequestResponseType, data: string | ArrayBuffer | object) {
    let temp = (typeof data === "string" || isArrayBuffer(data))
        ? data
        : JSON.stringify(data);

    switch (type) {
        case "":
        case "text":
            return typeof temp === "string" ? temp : decode(temp);

        case "arraybuffer":
            return isArrayBuffer(temp) ? temp : encode(temp).buffer;

        case "json":
            return typeof data === "string"
                ? JSON.parse(data)
                : isArrayBuffer(data)
                    ? JSON.parse(decode(data))
                    : data;

        case "blob":
            return new BlobP([temp]);

        default:
            return temp;
    }
}

// Alipay Mini Program
function safeAbort(task: IRequestTask | null) {
    if (task && typeof task === "object") {
        if ("abort" in task && typeof task.abort === "function") task.abort();
    }
}

function execUnset(xhr: XMLHttpRequestImpl) {
    state(xhr).pos = XHRCycle.UNSET;
    state(xhr).readyState = 0 /* UNSENT */;
}

function execOpened(xhr: XMLHttpRequestImpl) {
    state(xhr).pos = XHRCycle.OPENED;
    state(xhr).requestId += 1;
    setReadyStateAndNotify(xhr, 1 /* OPENED */);
}

function execLoadstart(xhr: XMLHttpRequestImpl, payload?: Payload) {
    state(xhr).pos = XHRCycle.LOADSTART;
    emitProgressEvent(xhr, "loadstart");
    return payload && execUploadLoadstart(xhr, payload);
}

function execUploadLoadstart(xhr: XMLHttpRequestImpl, payload: Payload) {
    if (state(xhr).pos !== XHRCycle.LOADSTART) return;
    state(xhr).pos = XHRCycle.UPLOAD_LOADSTART;
    const id = state(xhr).requestId;
    if (state(xhr).upload)
        emitProgressEvent(xhr.upload, "loadstart", 0, payload.size);
    return payload.promise
        .then(r => { if (id === state(xhr).requestId) { return execUploadLoad(xhr, payload, r); } })
        .catch(e => { if (id === state(xhr).requestId) { execUploadError(xhr); console.error(e); } });
}

function execUploadLoad(xhr: XMLHttpRequestImpl, payload: Payload, data: string | ArrayBuffer) {
    if (state(xhr).pos !== XHRCycle.UPLOAD_LOADSTART) return;
    state(xhr).pos = XHRCycle.UPLOAD_LOAD;
    if (state(xhr).upload && payload.size > 0)
        emitProgressEvent(xhr.upload, "load", payload.size, payload.size);
    return execUploadLoadend(xhr, "load", { payload, data });
}

function execUploadAbort(xhr: XMLHttpRequestImpl) {
    state(xhr).pos = XHRCycle.UPLOAD_ABORT;
    setReadyStateAndNotify(xhr, 4 /* DONE */);
    if (state(xhr).upload)
        emitProgressEvent(xhr.upload, "abort");
    execUploadLoadend(xhr, "abort");
}

function execUploadError(xhr: XMLHttpRequestImpl) {
    if (state(xhr).pos !== XHRCycle.UPLOAD_LOADSTART) return;
    state(xhr).pos = XHRCycle.UPLOAD_ERROR;
    setReadyStateAndNotify(xhr, 4 /* DONE */);
    if (state(xhr).upload)
        emitProgressEvent(xhr.upload, "error");
    execUploadLoadend(xhr, "error");
}

function execUploadTimeout(xhr: XMLHttpRequestImpl) {
    state(xhr).pos = XHRCycle.UPLOAD_TIMEOUT;
    setReadyStateAndNotify(xhr, 4 /* DONE */);
    if (state(xhr).upload)
        emitProgressEvent(xhr.upload, "timeout");
    execUploadLoadend(xhr, "timeout");
}

function execUploadLoadend(xhr: XMLHttpRequestImpl, type: string, ctx?: { payload: Payload, data: string | ArrayBuffer }) {
    if ((type === "load" && state(xhr).pos === XHRCycle.UPLOAD_LOAD) || type !== "load")
        state(xhr).pos = XHRCycle.UPLOAD_LOADEND;

    if (state(xhr).upload) {
        let l = ctx ? ctx.payload.size : 0;
        emitProgressEvent(xhr.upload, "loadend", l, l);
    }

    switch (type) {
        case "load": return ctx && ctx.data;
        case "abort": execAbort(xhr); break;
        case "error": execError(xhr); break;
        case "timeout": execTimeout(xhr); break;
    }
}

function execHeadersReceived(xhr: XMLHttpRequestImpl, res: IRequestSuccessCallbackBaseResult) {
    if (state(xhr).pos !== XHRCycle.LOADSTART && state(xhr).pos !== XHRCycle.UPLOAD_LOADEND) return;
    state(xhr).pos = XHRCycle.HEADERS_RECEIVED;
    state(xhr).responseURL = state(xhr).requestURL;
    state(xhr).status = "statusCode" in res ? res.statusCode : "status" in res ? (res as IRequestSuccessCallbackBaseResult).status! : 200;
    state(xhr).responseHeaders = new HeadersP(("header" in res ? res.header : "headers" in res ? (res as IRequestSuccessCallbackBaseResult).headers! : {}) as Record<string, string>);
    setReadyStateAndNotify(xhr, 2 /* HEADERS_RECEIVED */);
    execLoading(xhr, res);
}

function execLoading(xhr: XMLHttpRequestImpl, res: IRequestSuccessCallbackBaseResult) {
    if (state(xhr).pos !== XHRCycle.HEADERS_RECEIVED) return;
    state(xhr).pos = XHRCycle.LOADING;
    setReadyStateAndNotify(xhr, 3 /* LOADING */);
    execDone(xhr, res);
}

function execDone(xhr: XMLHttpRequestImpl, res: IRequestSuccessCallbackBaseResult) {
    if (state(xhr).pos !== XHRCycle.LOADING) return;
    state(xhr).pos = XHRCycle.DONE;

    const setResponse = () => {
        state(xhr).response = getResponse(xhr.responseType, res.data ?? "");
        if (!xhr.responseType || xhr.responseType === "text") state(xhr).responseText = xhr.response;
        setReadyStateAndNotify(xhr, 4 /* DONE */);
        execLoad(xhr);
    }

    try { setResponse(); }
    catch (e) { execError(xhr); console.error(e); }
}

function execLoad(xhr: XMLHttpRequestImpl) {
    if (state(xhr).pos !== XHRCycle.DONE) return;
    state(xhr).pos = XHRCycle.LOAD;
    let lstr = state(xhr).responseHeaders!.get("Content-Length");
    let contentLength = lstr ? (parseInt(lstr) || 0) : 0;
    emitProgressEvent(xhr, "load", contentLength, contentLength);
    execLoadend(xhr, contentLength);
}

function execAbort(xhr: XMLHttpRequestImpl) {
    state(xhr).pos = XHRCycle.ABORT;
    setReadyStateAndNotify(xhr, 4 /* DONE */);
    emitProgressEvent(xhr, "abort");
    execLoadend(xhr);
}

function execError(xhr: XMLHttpRequestImpl, err?: IRequestFailCallbackResult | IAliRequestFailCallbackResult) {
    switch (state(xhr).pos) {
        case XHRCycle.LOADSTART:
        case XHRCycle.UPLOAD_LOADEND:
        case XHRCycle.DONE:
            break;

        default:
            return;
    }
    state(xhr).pos = XHRCycle.ERROR;

    if (err) {
        state(xhr).status = 0;
        state(xhr).statusText = "errMsg" in err ? err.errMsg : "errorMessage" in err ? err.errorMessage : "";
    }

    setReadyStateAndNotify(xhr, 4 /* DONE */);
    emitProgressEvent(xhr, "error");
    execLoadend(xhr);
}

function execTimeout(xhr: XMLHttpRequestImpl) {
    state(xhr).pos = XHRCycle.TIMEOUT;
    setReadyStateAndNotify(xhr, 4 /* DONE */);
    emitProgressEvent(xhr, "timeout");
    execLoadend(xhr);
}

function execLoadend(xhr: XMLHttpRequestImpl, contentLength = 0) {
    state(xhr).pos = XHRCycle.LOADEND;
    state(xhr).requestTask = null;
    clearRequestTimeout(state(xhr));
    emitProgressEvent(xhr, "loadend", contentLength, contentLength);
}

const XMLHttpRequestE = (typeof XMLHttpRequest !== "undefined" && XMLHttpRequest) || XMLHttpRequestImpl;
export { XMLHttpRequestE as XMLHttpRequest };
