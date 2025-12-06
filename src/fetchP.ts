import { bodyState } from "./BodyP";
import { RequestP } from "./RequestP";
import { ResponseP } from "./ResponseP";
import { type AbortSignalP } from "./AbortSignalP";
import { g, state, isObjectType, MPException } from "./isPolyfill";
import { HeadersP, normalizeName, normalizeValue } from "./HeadersP";
import { XMLHttpRequest, XMLHttpRequestP, xhrState } from "./XMLHttpRequestP";

export function fetchP(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    if (new.target === fetchP) {
        throw new TypeError("fetch is not a constructor");
    }

    return new Promise(function (resolve, reject) {
        let request = new RequestP(input, init);

        if (request.signal && request.signal.aborted) {
            return reject((request.signal as AbortSignalP).reason);
        }

        let xhr = new XMLHttpRequest();

        xhr.onload = function () {
            let options = {
                headers: xhr instanceof XMLHttpRequestP ? (new HeadersP(xhr[xhrState]._resHeaders || undefined)) : parseHeaders(xhr.getAllResponseHeaders() || ""),
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

function parseHeaders(rawHeaders: string) {
    let headers = new HeadersP();
    let preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, " ");

    preProcessedHeaders
        .split("\r")
        .map(function (header) {
            return header.indexOf("\n") === 0 ? header.substring(1, header.length) : header;
        })
        .forEach(function (line) {
            let parts = line.split(":");
            let key = parts.shift()!.trim();
            if (key) {
                let value = parts.join(":").trim();
                try {
                    headers.append(key, value);
                } catch (error) {
                    console.warn("Response " + (error as Error).message);
                }
            }
        });

    return headers;
}

const fetchE = g["fetch"] || fetchP;
export { fetchE as fetch };
