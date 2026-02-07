import { BlobP } from "../file-system/BlobP";
import { HeadersP } from "../fetch-api/HeadersP";
import { encode } from "../helpers/encode";
import { decode } from "../helpers/decode";
import { Method } from "../helpers/Method";
import { Payload } from "../helpers/Payload";
import { isArrayBuffer } from "../helpers/isArrayBuffer";
import { statusTextMap } from "../helpers/statusTextMap";
import { Uint8Array_toBase64 } from "../helpers/toBase64";
import { attachFn, executeFn } from "../helpers/handlers";
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
    REQUEST_UNSET,
    IDLE,                       // outer
    REQUEST_OPENED,             // event
    SUSPEND,                    // outer
    LOADSTART,                  // event
    UPLOAD_LOADSTART,           // event
    UPLOAD_UPLOADING,           // async
    UPLOAD_LOAD,                // event
    UPLOAD_ABORT,               // event
    UPLOAD_ERROR,               // event
    UPLOAD_TIMEOUT,             // event
    UPLOAD_FINISHING,           // async
    UPLOAD_LOADEND,             // event
    RESPONSE_HEADERS_WAITING,   // async
    RESPONSE_HEADERS_RECEIVED,  // event
    RESPONSE_BODY_WAITING,      // async
    RESPONSE_BODY_LOADING,      // event
    RESPONSE_BODY_RECEIVING,    // async
    REQUEST_DONE,               // event
    REQUEST_FINISHING,          // async
    LOAD,                       // event
    ABORT,                      // event
    ERROR,                      // event
    TIMEOUT,                    // event
    LOADEND,                    // event
    END                         // outer
};

const mp = { request: getRequest() };
export const setRequest = (request: unknown) => { mp.request = request as TRequestFunc; }

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
        if (state(this).pos > XHRCycle.RESPONSE_BODY_WAITING) {
            throw new DOMExceptionP("Failed to set the 'responseType' property on 'XMLHttpRequest': The response type cannot be set if the object's state is LOADING or DONE.", "InvalidStateError");
        }
        state(this).responseType = XMLHttpRequestState.responseTypes.indexOf(value) > -1 ? value : "";
    }
    get responseURL() { return state(this).responseURL; }
    get responseXML(): Document | null { return null; }
    get status() { return state(this).status; }
    get statusText() {
        if (state(this).pos < XHRCycle.RESPONSE_HEADERS_RECEIVED) return "";
        return state(this).statusText || statusTextMap[this.status] || "unknown";
    }
    get timeout() { return state(this).timeout; }
    set timeout(value) { state(this).timeout = value >= 0 ? value : 0; }
    get upload() {
        if (!state(this).upload) { state(this).upload = createXMLHttpRequestUpload(); }
        return state(this).upload!;
    }
    get withCredentials() { return state(this).withCredentials; }
    set withCredentials(value) { state(this).withCredentials = !!value; }

    abort(): void {
        const requestTask = state(this).requestTask;
        clearRequest(state(this));

        switch (state(this).pos) {
            case XHRCycle.SUSPEND:
                state(this).requestHeaders = new HeadersP();
                break;

            case XHRCycle.UPLOAD_UPLOADING:
                execUploadAbort(this);
                execIdle(this);
                break;

            case XHRCycle.UPLOAD_FINISHING:
            case XHRCycle.RESPONSE_HEADERS_WAITING:
            case XHRCycle.RESPONSE_BODY_WAITING:
            case XHRCycle.RESPONSE_BODY_RECEIVING:
                execAbort(this);

            case XHRCycle.REQUEST_FINISHING:
            case XHRCycle.END:
                execIdle(this);
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

    open(method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null): void {
        checkArgsLength(arguments.length, 2, "XMLHttpRequest", "open");
        if (!async) { console.warn("Synchronous XMLHttpRequest is not supported because of its detrimental effects to the end user's experience."); }

        let _method = Method.normalizeMethod(method);
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

        execRequestOpened(this);
    }

    overrideMimeType(mime: string): void {
        checkArgsLength(arguments.length, 1, "XMLHttpRequest", "overrideMimeType");
        if (state(this).pos === XHRCycle.SUSPEND) {
            console.error(`TypeError: Failed to execute 'overrideMimeType' on 'XMLHttpRequest': mimeType ('${mime}') not implemented.`);
        }
    }

    send(body?: Document | XMLHttpRequestBodyInit | null): void {
        const s = state(this);
        const requestId = s.requestId;

        if (s.pos !== XHRCycle.SUSPEND) {
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

        const launch = (function (this: XMLHttpRequestImpl, data?: string | ArrayBuffer) {
            if (requestId !== s.requestId) return;
            options.data = data !== "" ? data : undefined;
            options.headers = options.header!; // Alipay Mini Program
            s.requestTask = mp.request(options);
        }).bind(this);

        execLoadstart(this);

        if (s.method !== "GET" && s.method !== "HEAD" && body !== null && body !== undefined) {
            const payload = new Payload(body as XMLHttpRequestBodyInit);
            if (!s.requestHeaders!.has("Content-Type") && payload.type) {
                (options.header as Record<string, string>)["Content-Type"] = payload.type;
            }
            execUploadLoadstart(this, payload, launch);
        } else {
            thenExec(() => execResponseHeadersWaiting(this, "", launch));
        }

        checkRequestTimeout(this, requestId);
    }

    setRequestHeader(name: string, value: string): void {
        checkArgsLength(arguments.length, 2, "XMLHttpRequest", "setRequestHeader");

        if (state(this).pos !== XHRCycle.SUSPEND) {
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

    pos: XHRCycle = XHRCycle.IDLE;

    readyState = 0 /* UNSENT */;
    response: any = "";
    responseText = "";
    responseType: XMLHttpRequestResponseType = "";
    static responseTypes = ["", "arraybuffer", "blob", "document", "json", "text"];
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

function normalizeDataType(responseType: XMLHttpRequestResponseType) {
    return (responseType === "blob" || responseType === "arraybuffer") ? "arraybuffer" : "text";
}

// Alipay Mini Program
function safeAbort(task: IRequestTask | null) {
    if (task && typeof task === "object") {
        if ("abort" in task && typeof task.abort === "function") task.abort();
    }
}

function checkRequestTimeout(xhr: XMLHttpRequestImpl, requestId: number) {
    const whenTimeout = () => {
        if (state(xhr).requestId !== requestId) return;
        const requestTask = state(xhr).requestTask;

        switch (state(xhr).pos) {
            case XHRCycle.UPLOAD_UPLOADING:
                execUploadTimeout(xhr);
                break;

            case XHRCycle.UPLOAD_FINISHING:
            case XHRCycle.RESPONSE_HEADERS_WAITING:
            case XHRCycle.RESPONSE_BODY_WAITING:
            case XHRCycle.RESPONSE_BODY_RECEIVING:
                execTimeout(xhr);
                break;
        }

        safeAbort(requestTask);
    }

    if (xhr.timeout) {
        state(xhr).timeoutId = setTimeout(() => { whenTimeout(); }, xhr.timeout);
    }
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

function requestSuccess(this: XMLHttpRequestImpl, requestId: number, res: IRequestSuccessCallbackBaseResult) {
    if (requestId !== state(this).requestId) return;
    execResponseHeadersReceived(this, res);
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
    if (type === "json") {
        return typeof data === "string"
            ? JSON.parse(data)
            : isArrayBuffer(data)
                ? JSON.parse(convertBack("text", data) as string)
                : data;
    }

    return convertBack(
        type as Exclude<XMLHttpRequestResponseType, "json" | "document">,
        (typeof data === "string" || isArrayBuffer(data)) ? data : JSON.stringify(data),
    );
}

function convertBack(
    type: "" | "text" | "arraybuffer" | "blob",
    data?: string | ArrayBuffer,
): string | ArrayBuffer | Blob {
    if (!type || type === "text") {
        return typeof data === "string" ? data : decode(data);
    }

    else if (type === "arraybuffer") {
        return isArrayBuffer(data) ? data : encode(data).buffer;
    }

    else if (type === "blob") {
        return new BlobP([data ?? ""]);
    }

    else {
        return data ?? "";
    }
}

function thenExec(fn: () => void) {
    Promise.resolve().then(fn);
}

function execIdle(xhr: XMLHttpRequestImpl) {
    state(xhr).pos = XHRCycle.IDLE;
    state(xhr).readyState = 0 /* UNSET */;
}

function execRequestOpened(xhr: XMLHttpRequestImpl) {
    state(xhr).pos = XHRCycle.REQUEST_OPENED;
    state(xhr).requestId += 1;
    setReadyStateAndNotify(xhr, 1 /* OPENED */);
    execSuspend(xhr);
}

function execSuspend(xhr: XMLHttpRequestImpl) {
    state(xhr).pos = XHRCycle.SUSPEND;
}

// external call
function execLoadstart(xhr: XMLHttpRequestImpl) {
    state(xhr).pos = XHRCycle.LOADSTART;
    emitProgressEvent(xhr, "loadstart");
}

// external call
function execUploadLoadstart(xhr: XMLHttpRequestImpl, payload: Payload, callback: (data?: string | ArrayBuffer) => void) {
    state(xhr).pos = XHRCycle.UPLOAD_LOADSTART;
    execUploadUploading(xhr, payload, callback);
    if (state(xhr).upload) emitProgressEvent(xhr.upload, "loadstart", 0, payload.size);
}

function execUploadUploading(xhr: XMLHttpRequestImpl, payload: Payload, callback: (data?: string | ArrayBuffer) => void) {
    state(xhr).pos = XHRCycle.UPLOAD_UPLOADING;
    const requestId = state(xhr).requestId;

    payload.promise
        .then(data => {
            if (requestId !== state(xhr).requestId) return;
            execUploadLoad(xhr, payload, data, callback);
        })
        .catch(e => {
            if (requestId !== state(xhr).requestId) return;
            execUploadError(xhr); console.error(e);
        });
}

function execUploadLoad(xhr: XMLHttpRequestImpl, payload: Payload, data: string | ArrayBuffer, callback: (data?: string | ArrayBuffer) => void) {
    if (state(xhr).pos !== XHRCycle.UPLOAD_UPLOADING) return;
    state(xhr).pos = XHRCycle.UPLOAD_LOAD;
    execUploadFinishing(xhr, payload, data, callback);
    if (state(xhr).upload && payload.size > 0) emitProgressEvent(xhr.upload, "load", payload.size, payload.size);
}

function execUploadAbort(xhr: XMLHttpRequestImpl) {
    state(xhr).pos = XHRCycle.UPLOAD_ABORT;
    setReadyStateAndNotify(xhr, 4 /* DONE */);
    if (state(xhr).upload) emitProgressEvent(xhr.upload, "abort");
    execUploadLoadend(xhr, "abort");
}

function execUploadError(xhr: XMLHttpRequestImpl) {
    if (state(xhr).pos !== XHRCycle.UPLOAD_UPLOADING) return;
    state(xhr).pos = XHRCycle.UPLOAD_ERROR;
    setReadyStateAndNotify(xhr, 4 /* DONE */);
    if (state(xhr).upload) emitProgressEvent(xhr.upload, "error");
    execUploadLoadend(xhr, "error");
}

function execUploadTimeout(xhr: XMLHttpRequestImpl) {
    state(xhr).pos = XHRCycle.UPLOAD_TIMEOUT;
    setReadyStateAndNotify(xhr, 4 /* DONE */);
    if (state(xhr).upload) emitProgressEvent(xhr.upload, "timeout");
    execUploadLoadend(xhr, "timeout");
}

function execUploadFinishing(xhr: XMLHttpRequestImpl, payload: Payload, data: string | ArrayBuffer, callback: (data?: string | ArrayBuffer) => void) {
    state(xhr).pos = XHRCycle.UPLOAD_FINISHING;
    thenExec(() => execUploadLoadend(xhr, "load", payload, data, callback));
}

function execUploadLoadend(xhr: XMLHttpRequestImpl, type: string, payload?: Payload, data?: string | ArrayBuffer, callback?: (data?: string | ArrayBuffer) => void) {
    if (type === "load") {
        if (state(xhr).pos === XHRCycle.UPLOAD_FINISHING) {
            state(xhr).pos = XHRCycle.UPLOAD_LOADEND;
            execResponseHeadersWaiting(xhr, data!, callback!);
        }

        if (state(xhr).upload && payload!.size > 0) {
            emitProgressEvent(xhr.upload, "loadend", payload!.size, payload!.size);
        }
    } else {
        state(xhr).pos = XHRCycle.UPLOAD_LOADEND;
        if (state(xhr).upload) { emitProgressEvent(xhr.upload, "loadend"); }

        switch (type) {
            case "abort": execAbort(xhr); break;
            case "error": execError(xhr); break;
            case "timeout": execTimeout(xhr); break;
        }
    }
}

function execResponseHeadersWaiting(xhr: XMLHttpRequestImpl, data: string | ArrayBuffer, callback: (data?: string | ArrayBuffer) => void) {
    if (state(xhr).pos !== XHRCycle.LOADSTART && state(xhr).pos !== XHRCycle.UPLOAD_LOADEND) return;
    state(xhr).pos = XHRCycle.RESPONSE_HEADERS_WAITING;
    try { callback(data); }
    catch (e) { execError(xhr); console.error(e); }
}

// external call
function execResponseHeadersReceived(xhr: XMLHttpRequestImpl, res: IRequestSuccessCallbackBaseResult) {
    if (state(xhr).pos !== XHRCycle.RESPONSE_HEADERS_WAITING) return;
    state(xhr).pos = XHRCycle.RESPONSE_HEADERS_RECEIVED;
    state(xhr).responseURL = state(xhr).requestURL;
    state(xhr).status = "statusCode" in res ? res.statusCode : "status" in res ? (res as IRequestSuccessCallbackBaseResult).status! : 200;
    state(xhr).responseHeaders = new HeadersP(("header" in res ? res.header : "headers" in res ? (res as IRequestSuccessCallbackBaseResult).headers! : {}) as Record<string, string>);
    execResponseBodyWaiting(xhr, res);
    setReadyStateAndNotify(xhr, 2 /* HEADERS_RECEIVED */);
}

function execResponseBodyWaiting(xhr: XMLHttpRequestImpl, res: IRequestSuccessCallbackBaseResult) {
    state(xhr).pos = XHRCycle.RESPONSE_BODY_WAITING;
    thenExec(() => execResponseBodyLoading(xhr, res));
}

function execResponseBodyLoading(xhr: XMLHttpRequestImpl, res: IRequestSuccessCallbackBaseResult) {
    if (state(xhr).pos !== XHRCycle.RESPONSE_BODY_WAITING) return;
    state(xhr).pos = XHRCycle.RESPONSE_BODY_LOADING;
    execResponseBodyReceiving(xhr, res);
    setReadyStateAndNotify(xhr, 3 /* LOADING */);
}

function execResponseBodyReceiving(xhr: XMLHttpRequestImpl, res: IRequestSuccessCallbackBaseResult) {
    state(xhr).pos = XHRCycle.RESPONSE_BODY_RECEIVING;

    const setResponse = () => {
        if (state(xhr).pos !== XHRCycle.RESPONSE_BODY_RECEIVING) return;
        state(xhr).response = getResponse(xhr.responseType, res.data ?? "");
        if (!xhr.responseType || xhr.responseType === "text") state(xhr).responseText = xhr.response;
        thenExec(() => execRequestDone(xhr));
    }

    thenExec(() => {
        try { setResponse(); }
        catch (e) { execError(xhr); console.error(e); }
    });
}

function execRequestDone(xhr: XMLHttpRequestImpl) {
    if (state(xhr).pos !== XHRCycle.RESPONSE_BODY_RECEIVING) return;
    state(xhr).pos = XHRCycle.REQUEST_DONE;
    execRequestFinishing(xhr);
    setReadyStateAndNotify(xhr, 4 /* DONE */);
}

function execRequestFinishing(xhr: XMLHttpRequestImpl) {
    state(xhr).pos = XHRCycle.REQUEST_FINISHING;
    thenExec(() => execLoad(xhr));
}

function execLoad(xhr: XMLHttpRequestImpl) {
    if (state(xhr).pos !== XHRCycle.REQUEST_FINISHING) return;
    state(xhr).pos = XHRCycle.LOAD;
    let contentLength = parseInt(state(xhr).responseHeaders!.get("Content-Length") || "0");
    emitProgressEvent(xhr, "load", contentLength, contentLength);
    execLoadend(xhr, contentLength);
}

function execAbort(xhr: XMLHttpRequestImpl) {
    state(xhr).pos = XHRCycle.ABORT;
    setReadyStateAndNotify(xhr, 4 /* DONE */);
    emitProgressEvent(xhr, "abort");
    execLoadend(xhr, 0);
}

function execError(xhr: XMLHttpRequestImpl, err?: IRequestFailCallbackResult | IAliRequestFailCallbackResult) {
    if (state(xhr).pos !== XHRCycle.UPLOAD_LOADEND && state(xhr).pos !== XHRCycle.RESPONSE_HEADERS_WAITING && state(xhr).pos !== XHRCycle.RESPONSE_BODY_RECEIVING) return;
    state(xhr).pos = XHRCycle.ERROR;

    if (err) {
        state(xhr).status = 0;
        state(xhr).statusText = "errMsg" in err ? err.errMsg : "errorMessage" in err ? err.errorMessage : "";
    }

    setReadyStateAndNotify(xhr, 4 /* DONE */);
    emitProgressEvent(xhr, "error");
    execLoadend(xhr, 0);
}

function execTimeout(xhr: XMLHttpRequestImpl) {
    state(xhr).pos = XHRCycle.TIMEOUT;
    setReadyStateAndNotify(xhr, 4 /* DONE */);
    emitProgressEvent(xhr, "timeout");
    execLoadend(xhr, 0);
}

function execLoadend(xhr: XMLHttpRequestImpl, contentLength: number) {
    state(xhr).pos = XHRCycle.LOADEND;
    emitProgressEvent(xhr, "loadend", contentLength, contentLength);
    execEnd(xhr);
}

function execEnd(xhr: XMLHttpRequestImpl) {
    state(xhr).pos = XHRCycle.END;
    state(xhr).requestTask = null;
    clearRequestTimeout(state(xhr));
}

const XMLHttpRequestE = (typeof XMLHttpRequest !== "undefined" && XMLHttpRequest) || XMLHttpRequestImpl;
export { XMLHttpRequestE as XMLHttpRequest };
