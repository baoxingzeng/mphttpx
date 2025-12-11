import { HeadersP } from "./HeadersP";
import { BodyP, bodyState, _name, _body, initFn } from "./BodyP";
import { normalizeMethod } from "./XMLHttpRequestP";
import { AbortControllerP } from "./AbortControllerP";
import { g, polyfill, isPolyfillType, defineStringTag } from "./isPolyfill";

/** @internal */
const state = Symbol(/* "RequestState" */);
export { state as requestState };

export class RequestP extends BodyP implements Request {
    constructor(input: RequestInfo | URL, init?: RequestInit) {
        super();
        this[state] = new RequestState();
        const that = this[state];

        this[bodyState][_name] = "Request";

        let options = init ?? {};
        let body = options.body;

        if (isPolyfillType<Request>("Request", input)) {
            if (input.bodyUsed) {
                throw new TypeError("Failed to construct 'Request': Cannot construct a Request with a Request object that has already been used.");
            }
            that.credentials = input.credentials;
            if (!options.headers) { that.headers = new HeadersP(input.headers); }
            that.method = input.method;
            that.mode = input.mode;
            let inputSignal = (input as RequestP)[state].signal; if (inputSignal) { that.signal = inputSignal; }
            that.url = input.url;

            let _input = input as RequestP; if (!body && _input[bodyState][_body] !== null) {
                body = _input[bodyState][_body];
                _input[bodyState].bodyUsed = true;
            }
        } else {
            that.url = String(input);
        }

        if (options.credentials) { that.credentials = options.credentials; }
        if (options.headers) { that.headers = new HeadersP(options.headers); }
        if (options.method) { that.method = normalizeMethod(options.method); }
        if (options.mode) { that.mode = options.mode; }
        if (options.signal) { that.signal = options.signal; }

        if ((this.method === "GET" || this.method === "HEAD") && body) {
            throw new TypeError("Failed to construct 'Request': Request with GET/HEAD method cannot have body.");
        }

        initFn.call(this[bodyState], body, this.headers);

        if (this.method === "GET" || this.method === "HEAD") {
            if (options.cache === "no-store" || options.cache === "no-cache") {
                // Search for a '_' parameter in the query string
                let reParamSearch = /([?&])_=[^&]*/;
                if (reParamSearch.test(this.url)) {
                    // If it already exists then set the value with the current time
                    that.url = this.url.replace(reParamSearch, "$1_=" + (new Date()).getTime());
                } else {
                    // Otherwise add a new '_' parameter to the end with the current time
                    let reQueryString = /\?/;
                    that.url += (reQueryString.test(this.url) ? "&" : "?") + "_=" + (new Date()).getTime();
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
        const that = this[state];
        if (!that.headers) { that.headers = new HeadersP(); }
        return that.headers!;
    }

    get integrity() { return this[state].integrity; }
    get keepalive() { return this[state].keepalive; }
    get method() { return this[state].method; }
    get mode() { return this[state].mode; }
    get redirect() { return this[state].redirect; }
    get referrer() { return this[state].referrer; }
    get referrerPolicy() { return this[state].referrerPolicy; }

    get signal() {
        const that = this[state];
        if (!that.signal) { that.signal = (new AbortControllerP()).signal; }
        return that.signal!;
    }

    get url() { return this[state].url; }

    clone(): Request {
        return new RequestP(this, { body: this[bodyState][_body] ?? null });
    }

    toString() { return "[object Request]"; }
    get isPolyfill() { return { symbol: polyfill, hierarchy: ["Request", "Body"] }; }
}

defineStringTag(RequestP, "Request");

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

const RequestE = g["Request"] || RequestP;
export { RequestE as Request };
