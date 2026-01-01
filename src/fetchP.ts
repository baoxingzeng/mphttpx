import { XMLHttpRequest } from "./XMLHttpRequestP";
import { normalizeName, normalizeValue, parseHeaders } from "./HeadersP";
import { Body_toPayload } from "./BodyImpl";
import { RequestP, requestState } from "./RequestP";
import { ResponseP, responseState } from "./ResponseP";
import { g, checkArgs, MPException, isObjectType } from "./isPolyfill";

const mp = { XMLHttpRequest: XMLHttpRequest };
export const setXMLHttpRequest = (XHR: typeof globalThis["XMLHttpRequest"]) => { mp.XMLHttpRequest = XHR; }

export function fetchP(...args: [RequestInfo | URL, RequestInit?]): Promise<Response> {
    if (new.target === fetchP) {
        throw new TypeError("fetch is not a constructor");
    }

    const [input, init] = args;
    checkArgs(args, "Window", "fetch", 1);

    return new Promise((resolve, reject) => {
        const request = new RequestP(input, init);
        const signal = request[requestState].signal;

        if (signal && signal.aborted) {
            return reject((signal as (AbortSignal & { reason: any })).reason);
        }

        let xhr = new mp.XMLHttpRequest();

        xhr.onload = function () {
            let options = {
                headers: parseHeaders(xhr.getAllResponseHeaders() || ""),
                status: xhr.status,
                statusText: xhr.statusText,
            }

            // This check if specifically for when a user fetches a file locally from the file system
            // Only if the status is out of a normal range
            if (request.url.indexOf("file://") === 0 && (xhr.status < 200 || xhr.status > 599)) {
                options.status = 200;
            }

            setTimeout(() => {
                let response = new ResponseP("response" in xhr ? xhr.response : (xhr as XMLHttpRequest).responseText, options);
                response[responseState].url = "responseURL" in xhr ? xhr.responseURL : (options.headers.get("X-Request-URL") || "");
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

        xhr.open(request.method, request.url, true);

        if (request.credentials === "include") {
            xhr.withCredentials = true;
        } else if (request.credentials === "omit") {
            xhr.withCredentials = false;
        }

        if ("responseType" in xhr) {
            xhr.responseType = "arraybuffer";
        }

        if (init && typeof init === "object" && typeof init.headers === "object" && !isObjectType<Headers>("Headers", init.headers)) {
            let headers = init.headers as Record<string, string>;
            let names: string[] = [];

            Object.getOwnPropertyNames(headers).forEach(name => {
                names.push(normalizeName(name));
                xhr.setRequestHeader(name, normalizeValue(headers[name]!));
            });

            request.headers.forEach((value, name) => {
                if (names.indexOf(name) === -1) {
                    xhr.setRequestHeader(name, value);
                }
            });
        } else {
            request.headers.forEach((value, name) => {
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

const fetchE = g["fetch"] || fetchP;
export { fetchE as fetch };
