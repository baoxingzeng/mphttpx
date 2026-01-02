import { BodyImpl, bodyState, Body_init, Body_toPayload } from "./BodyImpl";
import { HeadersP } from "./HeadersP";
import { g, polyfill, Class_setStringTag, checkArgsLength } from "./isPolyfill";

/** @internal */ const state = Symbol(/* "ResponseState" */);
/** @internal */ export { state as responseState };

/** @type {typeof globalThis.Response} */
export class ResponseP extends BodyImpl implements Response {
    constructor(body?: BodyInit | null, init?: ResponseInit) {
        super();
        this[bodyState].name = "Response";

        this[state] = new ResponseState();
        const s = this[state];

        let _init = init ?? {};
        if (typeof _init !== "object") {
            throw new TypeError("Failed to construct 'Response': The provided value is not of type 'ResponseInit'.");
        }

        let status = _init.status === undefined ? 200 : _init.status;

        if (status < 200 || status > 500) {
            throw new RangeError(`Failed to construct 'Response': The status provided (${+status}) is outside the range [200, 599].`);
        }

        if (_init.headers) { s.headers = new HeadersP(_init.headers); }
        s.ok = status >= 200 && status < 300;
        s.status = status;
        s.statusText = _init.statusText === undefined ? "" : "" + _init.statusText;
        
        Body_init(this, body);
    }

    /** @internal */
    [state]: ResponseState;

    get headers() {
        const s = this[state];
        if (!s.headers) { s.headers = new HeadersP(); }
        return s.headers!;
    }
    
    get ok() { return this[state].ok; }
    get redirected() { return this[state].redirected; }
    get status() { return this[state].status; }
    get statusText() { return this[state].statusText; }
    get type() { return this[state].type; }
    get url() { return this[state].url; }

    clone(): Response {
        if (this.bodyUsed) {
            throw new TypeError("Failed to execute 'clone' on 'Response': Response body is already used");
        }
        let response = new ResponseP(Body_toPayload(this), {
            headers: new HeadersP(this.headers),
            status: this.status,
            statusText: this.statusText,
        });
        response[state].url = this.url;
        return response;
    }
    
    static json(...args: [any, ResponseInit?]): Response {
        const [data, init] = args;
        checkArgsLength(args, 1, "Response", "json");
        let response = new ResponseP(typeof data === "string" ? data : JSON.stringify(data), init);
        response.headers.set("Content-Type", "application/json");
        return response;
    }

    static error(): Response {
        let response = new ResponseP(null, {status: 200, statusText: ""});
        response[state].ok = false;
        response[state].status = 0;
        response[state].type = "error";
        return response;
    }

    static redirect(...args: [string | URL, number?]): Response {
        const [url, status = 301] = args;
        checkArgsLength(args, 1, "Response", "redirect");
        if ([301, 302, 303, 307, 308].indexOf(status) === -1) {
            throw new RangeError("Failed to execute 'redirect' on 'Response': Invalid status code");
        }
        return new ResponseP(null, { status, headers: { location: "" + url } });
    }

    /** @internal */ toString() { return "[object Response]"; }
    /** @internal */ get isPolyfill() { return { symbol: polyfill, hierarchy: ["Response"] }; }
}

Class_setStringTag(ResponseP, "Response");

/** @internal */
class ResponseState {
    headers?: Headers;
    ok: boolean = true;
    redirected: boolean = false;
    status: number = 200;
    statusText: string = "";
    type: ResponseType = "default";
    url: string = "";
}

const ResponseE = g["Response"] || ResponseP;
export { ResponseE as Response };
