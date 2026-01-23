import { HeadersP } from "./HeadersP";
import { AbortControllerP } from "./AbortControllerP";
import { g, polyfill, checkArgsLength, isPolyfillType } from "./isPolyfill";
import { BodyImpl, bodyState, Body_init, Body_toPayload } from "./BodyImpl";

/** @internal */ const state = Symbol(/* "RequestState" */);
/** @internal */ export { state as requestState };

export class RequestP extends BodyImpl implements Request {
    constructor(...args: [RequestInfo | URL, RequestInit?]) {
        const [input, init] = args;
        checkArgsLength(args, 1, "Request");
        super();
        this[bodyState].name = "Request";

        this[state] = new RequestState();
        const s = this[state];

        let _init = init ?? {};
        if (typeof _init !== "object") {
            throw new TypeError("Failed to construct 'Request': The provided value is not of type 'RequestInit'.");
        }

        let body = _init.body;

        if (isPolyfillType<Request>("Request", input)) {
            if (input.bodyUsed) {
                throw new TypeError("Failed to construct 'Request': Cannot construct a Request with a Request object that has already been used.");
            }
            s.cache = input.cache;
            s.credentials = input.credentials;
            if (!_init.headers) { s.headers = new HeadersP(input.headers); }
            s.method = input.method;
            s.mode = input.mode;
            let inputSignal = (input as RequestP)[state].signal; if (inputSignal) { s.signal = inputSignal; }
            s.url = input.url;

            let payload = Body_toPayload(input);
            if (!body && payload !== "") { body = payload; (input as RequestP)[bodyState].bodyUsed = true; }
        } else {
            s.url = "" + input;
        }

        if (_init.cache) { s.cache = _init.cache; }
        if (_init.credentials) { s.credentials = _init.credentials; }
        if (_init.headers) { s.headers = new HeadersP(_init.headers); }
        if (_init.method) { s.method = normalizeMethod(_init.method); }
        if (_init.mode) { s.mode = _init.mode; }
        if (_init.signal) { s.signal = _init.signal; }

        if ((this.method === "GET" || this.method === "HEAD") && body) {
            throw new TypeError("Failed to construct 'Request': Request with GET/HEAD method cannot have body.");
        }

        Body_init(this, body);

        if (this.method === "GET" || this.method === "HEAD") {
            if (_init.cache === "no-store" || _init.cache === "no-cache") {
                // Search for a '_' parameter in the query string
                let reParamSearch = /([?&])_=[^&]*/;
                if (reParamSearch.test(this.url)) {
                    // If it already exists then set the value with the current time
                    s.url = this.url.replace(reParamSearch, "$1_=" + (new Date()).getTime());
                } else {
                    // Otherwise add a new '_' parameter to the end with the current time
                    let reQueryString = /\?/;
                    s.url += (reQueryString.test(this.url) ? "&" : "?") + "_=" + (new Date()).getTime();
                }
            }
        }
    }

    /** @internal */
    [state]: RequestState;

    get cache() { return this[state].cache; }
    get credentials() { return this[state].credentials; }
    get destination() { return this[state].destination; }

    get headers() {
        const s = this[state];
        if (!s.headers) { s.headers = new HeadersP(); }
        return s.headers!;
    }

    get integrity() { return this[state].integrity; }
    get keepalive() { return this[state].keepalive; }
    get method() { return this[state].method; }
    get mode() { return this[state].mode; }
    get redirect() { return this[state].redirect; }
    get referrer() { return this[state].referrer; }
    get referrerPolicy() { return this[state].referrerPolicy; }

    get signal() {
        const s = this[state];
        if (!s.signal) { s.signal = (new AbortControllerP()).signal; }
        return s.signal!;
    }

    get url() { return this[state].url; }

    clone(): Request {
        if (this.bodyUsed) {
            throw new TypeError("Failed to execute 'clone' on 'Request': Request body is already used");
        }
        return new RequestP(this, { body: Body_toPayload(this) ?? null });
    }

    /** @internal */ toString() { return "[object Request]"; }
    /** @internal */ get [Symbol.toStringTag]() { return "Request"; }
    /** @internal */ get isPolyfill() { return { symbol: polyfill, hierarchy: ["Request"] }; }
}

/** @internal */
class RequestState {
    cache: RequestCache = "default";
    credentials: RequestCredentials = "same-origin";
    destination: RequestDestination = "";
    headers?: Headers;
    integrity: string = "";
    keepalive: boolean = false;
    method: string = "GET";
    mode: RequestMode = "cors";
    redirect: RequestRedirect = "follow";
    referrer: string = "about:client";
    referrerPolicy: ReferrerPolicy = "";
    signal?: AbortSignal;
    url: string = "";
}

// HTTP methods whose capitalization should be normalized
const methods = ["CONNECT", "DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT", "TRACE"];

/** @internal */
export function normalizeMethod(method: string) {
    let upcased = method.toUpperCase();
    return methods.indexOf(upcased) > -1 ? upcased : method;
}

const RequestE = g["Request"] || RequestP;
export { RequestE as Request };
