import { mp } from "./platform";
import { bodyState } from "./BodyP";
import { RequestP } from "./RequestP";
import { ResponseP } from "./ResponseP";
import { type AbortSignalP } from "./AbortSignalP";
import { XMLHttpRequestP, xhrState } from "./XMLHttpRequestP";
import { g, state, isObjectType, MPException } from "./isPolyfill";
import { HeadersP, normalizeName, normalizeValue } from "./HeadersP";

export function fetchP(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    if (new.target === fetchP) {
        throw new TypeError("fetch is not a constructor");
    }

    return new Promise(function (resolve, reject) {
        let request = new RequestP(input, init);

        if (request.signal && request.signal.aborted) {
            return reject((request.signal as AbortSignalP).reason);
        }

        let xhr = new XMLHttpRequestP();

        xhr.onload = function () {
            let options = {
                headers: new HeadersP((xhr as XMLHttpRequestP)[xhrState]._resHeaders || undefined),
                status: xhr.status,
                statusText: xhr.statusText,
            }

            setTimeout(() => {
                const response = new ResponseP(xhr.response, options);
                response[state].url = xhr.responseURL;

                resolve(response);
            });
        }

        xhr.onerror = function () {
            setTimeout(function () {
                reject(new TypeError("Failed to fetch"));
            });
        }

        xhr.ontimeout = function () {
            setTimeout(function () {
                reject(new MPException("request:fail timeout", "TimeoutError"));
            });
        }

        xhr.onabort = function () {
            setTimeout(function () {
                reject(new MPException("request:fail abort", "AbortError"));
            });
        }

        xhr.open(request.method, request.url);

        if (request.credentials === "include") {
            xhr.withCredentials = true
        } else if (request.credentials === "omit") {
            xhr.withCredentials = false
        }

        if (init && isObjectHeaders(init.headers)) {
            let headers = init.headers;
            let names: string[] = [];

            Object.entries(headers).forEach(([name, value]) => {
                names.push(normalizeName(name));
                xhr.setRequestHeader(name, normalizeValue(value));
            });

            request.headers.forEach(function (value, name) {
                if (names.indexOf(normalizeName(name)) === -1) {
                    xhr.setRequestHeader(name, value);
                }
            });
        } else {
            request.headers.forEach(function (value, name) {
                xhr.setRequestHeader(name, value);
            });
        }

        if (request.signal) {
            const abortXHR = () => { xhr.abort(); }
            request.signal.addEventListener("abort", abortXHR);

            xhr.onreadystatechange = function () {
                // DONE (success or failure)
                if (xhr.readyState === 4) {
                    request.signal.removeEventListener("abort", abortXHR);
                }
            }
        }

        xhr.send(request[bodyState]._body as (XMLHttpRequestBodyInit | null));
    });
}

function isObjectHeaders(val: unknown): val is Record<string, string> {
    return typeof val === "object" && !isObjectType<Headers>("Headers", val);
}

const fetchE = !mp ? g["fetch"] : fetchP;
export { fetchE as fetch };
