import { type AbortSignalP } from "./AbortSignalP";
import { Body_toPayload } from "./BodyImpl";
import { RequestP, requestState } from "./RequestP";
import { ResponseP, responseState } from "./ResponseP";
import { normalizeName, normalizeValue } from "./HeadersP";
import { XMLHttpRequest, getAllResponseHeaders } from "./XMLHttpRequestP";
import { g, isObjectType, MPException, objectEntries } from "./isPolyfill";

const mp = { XMLHttpRequest: XMLHttpRequest };
export const setXMLHttpRequest = (XHR: typeof globalThis["XMLHttpRequest"]) => { mp.XMLHttpRequest = XHR; }

export function fetchP(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    if (new.target === fetchP) {
        throw new TypeError("fetch is not a constructor");
    }

    return new Promise(function (resolve, reject) {
        const request = new RequestP(input, init);
        const signal = request[requestState].signal;

        if (signal && signal.aborted) {
            return reject((signal as AbortSignalP).reason);
        }

        let xhr = new mp.XMLHttpRequest();

        xhr.onload = function () {
            let options = {
                headers: getAllResponseHeaders(xhr),
                status: xhr.status,
                statusText: xhr.statusText,
            }

            setTimeout(() => {
                let response = new ResponseP(xhr.response, options);
                response[responseState].url = xhr.responseURL;

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

        if (init && typeof init === "object" && isObjectHeaders(init.headers)) {
            let headers = init.headers;
            let names: string[] = [];

            objectEntries(headers).forEach(([name, value]) => {
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

        if (signal) {
            const abortXHR = () => { xhr.abort(); }
            signal.addEventListener("abort", abortXHR);

            xhr.onreadystatechange = function () {
                // DONE (success or failure)
                if (xhr.readyState === 4) {
                    signal.removeEventListener("abort", abortXHR);
                }
            }
        }

        xhr.send(Body_toPayload(request) as XMLHttpRequestBodyInit);
    });
}

function isObjectHeaders(val: unknown): val is Record<string, string> {
    return typeof val === "object" && !isObjectType<Headers>("Headers", val);
}

const fetchE = g["fetch"] || fetchP;
export { fetchE as fetch };
