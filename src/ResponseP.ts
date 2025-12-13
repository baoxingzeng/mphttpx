import { HeadersP } from "./HeadersP";
import { g, polyfill, defineStringTag } from "./isPolyfill";
import { BodyImpl, bodyState, _name, _body, initFn } from "./BodyImpl";

/** @internal */ const state = Symbol(/* "ResponseState" */);
/** @internal */ export { state as responseState };

export class ResponseP extends BodyImpl implements Response {
    constructor(body?: BodyInit | null, init?: ResponseInit) {
        super();
        this[state] = new ResponseState();
        const that = this[state];

        this[bodyState][_name] = "Response";

        let options = init ?? {};
        let status = options.status === undefined ? 200 : options.status;

        if (status < 200 || status > 500) {
            throw new RangeError(`Failed to construct 'Response': The status provided (${+status}) is outside the range [200, 599].`);
        }

        if (options.headers) { that.headers = new HeadersP(options.headers); }
        that.ok = this.status >= 200 && this.status < 300;
        that.status = status;
        that.statusText = options.statusText === undefined ? "" : "" + options.statusText;
        
        initFn.call(this[bodyState], body, this.headers);
    }

    /** @internal */
    [state]: ResponseState;

    get headers() {
        const that = this[state];
        if (!that.headers) { that.headers = new HeadersP(); }
        return that.headers!;
    }
    
    get ok() { return this[state].ok; }
    get redirected() { return this[state].redirected; }
    get status() { return this[state].status; }
    get statusText() { return this[state].statusText; }
    get type() { return this[state].type; }
    get url() { return this[state].url; }

    clone(): Response {
        let response = new ResponseP(this[bodyState][_body], {
            headers: new HeadersP(this.headers),
            status: this.status,
            statusText: this.statusText,
        });

        response[state].url = this.url;
        return response;
    }
    
    static json(data: any, init?: ResponseInit): Response {
        return new Response(JSON.stringify(data), init);
    }

    static error() {
        let response = new ResponseP(null, {status: 200, statusText: ""});
        response[state].ok = false;
        response[state].status = 0;
        response[state].type = "error";
        return response;
    }

    static redirect(url: string | URL, status = 301) {
        if ([301, 302, 303, 307, 308].indexOf(status) === -1) {
            throw new RangeError("Failed to execute 'redirect' on 'Response': Invalid status code");
        }

        return new Response(null, { status, headers: { location: String(url) } });
    }

    toString() { return "[object Response]"; }
    get isPolyfill() { return { symbol: polyfill, hierarchy: ["Response", "Body"] }; }
}

defineStringTag(ResponseP, "Response");

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
