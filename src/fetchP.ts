import { Body_toPayload } from "./BodyImpl";
import { g, MPException } from "./isPolyfill";
import { XHR_setRequestHeaders } from "./HeadersP";
import { RequestP, requestState } from "./RequestP";
import { ResponseP, responseState } from "./ResponseP";
import { XMLHttpRequest, getAllResponseHeaders, XHR_setConverted } from "./XMLHttpRequestP";

const mp = { XMLHttpRequest: XMLHttpRequest };
export const setXMLHttpRequest = (XHR: typeof globalThis["XMLHttpRequest"]) => { mp.XMLHttpRequest = XHR; }

export function fetchP(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    if (new.target === fetchP) {
        throw new TypeError("fetch is not a constructor");
    }

    return new Promise((resolve, reject) => {
        const request = new RequestP(input, init);
        const signal = request[requestState].signal;

        if (signal && signal.aborted) {
            return reject((signal as (AbortSignal & { reason: any })).reason);
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
            xhr.withCredentials = true;
        } else if (request.credentials === "omit") {
            xhr.withCredentials = false;
        }

        XHR_setRequestHeaders(xhr, request, init);

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

        XHR_setConverted(xhr, true);
        xhr.send(Body_toPayload(request) as XMLHttpRequestBodyInit);
    });
}

const fetchE = g["fetch"] || fetchP;
export { fetchE as fetch };
