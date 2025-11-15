import { HeadersP } from "./HeadersP";
import { BodyP, bodyState } from "./BodyP";
import { normalizeMethod } from "./XMLHttpRequestP";
import { AbortControllerP } from "./AbortControllerP";
import { g, state, polyfill, isPolyfillType, defineStringTag } from "./isPolyfill";

export class RequestP extends BodyP implements Request {
    constructor(input: RequestInfo | URL, init?: RequestInit) {
        super();
        this[state] = new RequestState();
        this[bodyState]._name = "Request";

        let options = init ?? {};
        let body = options.body;

        if (isPolyfillType<Request>("Request", input)) {
            if (input.bodyUsed) {
                throw new TypeError("Failed to construct 'Request': Cannot construct a Request with a Request object that has already been used.");
            }
            this[state].credentials = input.credentials;
            if (!options.headers) { this[state].headers = new HeadersP(input.headers); }
            this[state].method = input.method;
            this[state].mode = input.mode;
            this[state].signal = input.signal;
            this[state].url = input.url;

            let _input = input as RequestP;
            if (!body && _input[bodyState]._body !== null) {
                body = _input[bodyState]._body;
                _input[bodyState].bodyUsed = true;
            }
        } else {
            this[state].url = String(input);
        }

        if (options.credentials) { this[state].credentials = options.credentials; }
        if (options.headers) { this[state].headers = new HeadersP(options.headers); }
        if (options.method) { this[state].method = normalizeMethod(options.method); }
        if (options.mode) { this[state].mode = options.mode; }
        if (options.signal) { this[state].signal = options.signal; }

        if ((this.method === "GET" || this.method === "HEAD") && body) {
            throw new TypeError("Failed to construct 'Request': Request with GET/HEAD method cannot have body.");
        }

        this[bodyState].init(body, this.headers);

        if (this.method === "GET" || this.method === "HEAD") {
            if (options.cache === "no-store" || options.cache === "no-cache") {
                // Search for a '_' parameter in the query string
                let reParamSearch = /([?&])_=[^&]*/;
                if (reParamSearch.test(this.url)) {
                    // If it already exists then set the value with the current time
                    this[state].url = this.url.replace(reParamSearch, "$1_=" + (new Date()).getTime());
                } else {
                    // Otherwise add a new '_' parameter to the end with the current time
                    let reQueryString = /\?/;
                    this[state].url += (reQueryString.test(this.url) ? "&" : "?") + "_=" + (new Date()).getTime();
                }
            }
        }
    }

    [state]: RequestState;

    get cache() { return this[state].cache; }
    get credentials() { return this[state].credentials; }
    get destination() { return this[state].destination; }
    get headers() { return this[state].headers; }
    get integrity() { return this[state].integrity; }
    get keepalive() { return this[state].keepalive; }
    get method() { return this[state].method; }
    get mode() { return this[state].mode; }
    get redirect() { return this[state].redirect; }
    get referrer() { return this[state].referrer; }
    get referrerPolicy() { return this[state].referrerPolicy; }
    get signal() { return this[state].signal; }
    get url() { return this[state].url; }

    clone(): Request {
        return new RequestP(this, { body: this[bodyState]._body ?? null });
    }

    toString() { return "[object Request]"; }
    get isPolyfill() { return { symbol: polyfill, hierarchy: ["Request"] }; }
}

defineStringTag(RequestP, "Request");

class RequestState {
    cache: RequestCache = "default";
    credentials: RequestCredentials = "same-origin";
    destination: RequestDestination = "";
    headers: Headers = new HeadersP();
    integrity: string = "";
    keepalive: boolean = false;
    method: string = "GET";
    mode: RequestMode = "cors";
    redirect: RequestRedirect = "follow";
    referrer: string = "about:client";
    referrerPolicy: ReferrerPolicy = "";
    signal: AbortSignal = (new AbortControllerP()).signal;
    url: string = "";
}

const RequestE = g["Request"] || RequestP;
export { RequestE as Request };
