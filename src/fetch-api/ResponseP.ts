import { HeadersP } from "./HeadersP";
import { BodyImpl, Body_init } from "./BodyImpl"
import { SymbolP, setState, checkArgsLength } from "../utils";

export class ResponseP extends BodyImpl implements Response {
    static json(data: any, init?: ResponseInit): Response {
        checkArgsLength(arguments.length, 1, "Response", "json");
        let response = new ResponseP(typeof data === "string" ? data : JSON.stringify(data), init);
        response.headers.set("Content-Type", "application/json");
        return response;
    }

    static error(): Response {
        let response = new ResponseP(null, { status: 200, statusText: "" });
        state(response).status = 0;
        state(response).type = "error";
        return response;
    }

    static redirect(url: string | URL, status = 302): Response {
        checkArgsLength(arguments.length, 1, "Response", "redirect");
        if ([301, 302, 303, 307, 308].indexOf(status) === -1) {
            throw new RangeError("Failed to execute 'redirect' on 'Response': Invalid status code");
        }
        return new ResponseP(null, { status, headers: { location: "" + url } });
    }

    constructor(body?: BodyInit | null, init?: ResponseInit) {
        super();
        setState(this, "__Response__", new ResponseState());
        const s = state(this);

        let _init = init ?? {};
        if (typeof _init !== "object") {
            throw new TypeError("Failed to construct 'Response': The provided value is not of type 'ResponseInit'.");
        }

        if (_init.headers !== undefined) {
            state(this).headers = new HeadersP(_init.headers);
        }

        let status = _init.status === undefined ? 200 : _init.status;
        if (status < 200 || status > 500) {
            throw new RangeError(`Failed to construct 'Response': The status provided (${+status}) is outside the range [200, 599].`);
        }

        s.status = status;
        s.statusText = _init.statusText === undefined ? "" : "" + _init.statusText;

        Body_init(this, body);
        let payload = this.__Body__.payload;

        if (payload && payload.type && !this.headers.has("Content-Type")) {
            this.headers.set("Content-Type", payload.type);
        }
    }

    /** @internal */ declare readonly __Response__: ResponseState;

    get headers() {
        if (!state(this).headers) { state(this).headers = new HeadersP(); }
        return state(this).headers!;
    }
    get ok() { return this.status >= 200 && this.status < 300; }
    get redirected() { return false; }
    get status() { return state(this).status; }
    get statusText() { return state(this).statusText; }
    get type() { return state(this).type; }
    get url() { return state(this).url; }

    clone(): Response {
        if (this.bodyUsed) {
            throw new TypeError("Failed to execute 'clone' on 'Response': Response body is already used");
        }
        let response = new ResponseP(null, {
            headers: new HeadersP(this.headers),
            status: this.status,
            statusText: this.statusText,
        });
        state(response).url = this.url;
        response.__Body__.payload = this.__Body__.payload;
        return response;
    }

    /** @internal */ toString() { return "[object Response]"; }
    /** @internal */ get [SymbolP.toStringTag]() { return "Response"; }
    /** @internal */ get __MPHTTPX__() { return { chain: ["Response", "Body"] }; }
}

/** @internal */
class ResponseState {
    headers?: Headers;
    status: number = 200;
    statusText: string = "";
    type: ResponseType = "default";
    url: string = "";
}

function state(target: ResponseP) {
    return target.__Response__;
}

const ResponseE = (typeof Response !== "undefined" && Response) || ResponseP;
export { ResponseE as Response };
