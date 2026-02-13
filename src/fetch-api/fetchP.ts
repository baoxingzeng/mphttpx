import { RequestP } from "./RequestP";
import { ResponseP } from "./ResponseP";
import { DOMExceptionP, checkArgsLength } from "../utils";
import { XMLHttpRequest } from "../mini-program/XMLHttpRequestImpl";
import { HeadersP, isHeaders, normalizeName, normalizeValue } from "./HeadersP";

const mp = { XMLHttpRequest: XMLHttpRequest };
export function setXMLHttpRequest(XHR: unknown) { mp.XMLHttpRequest = XHR as typeof globalThis.XMLHttpRequest; }

export function fetchP(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    checkArgsLength(arguments.length, 1, "Window", "fetch");
    if (new.target === fetchP) { throw new TypeError("fetch is not a constructor"); }

    return new Promise((resolve, reject) => {
        const request = new RequestP(input, init);
        const signal = request.__Request__.signal;

        if (signal && signal.aborted) {
            return reject(signal.reason);
        }

        let xhr = new mp.XMLHttpRequest();
        let aborted = false;
        let payload = request.__Body__.payload;

        xhr.onload = () => {
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
                response.__Response__.url = "responseURL" in xhr ? xhr.responseURL : (options.headers.get("X-Request-URL") || "");
                resolve(response);
            });
        }

        xhr.onerror = () => { setTimeout(() => { reject(new TypeError("Failed to fetch")); }); }
        xhr.ontimeout = () => { setTimeout(() => { reject(new DOMExceptionP("request:fail timeout", "TimeoutError")); }); }
        xhr.onabort = () => { setTimeout(() => { reject(new DOMExceptionP("The user aborted a request.", "AbortError")); }); }
        xhr.open(request.method, request.url, true);

        if (request.credentials === "include") {
            xhr.withCredentials = true;
        } else if (request.credentials === "omit") {
            xhr.withCredentials = false;
        }

        if ("responseType" in xhr) {
            xhr.responseType = "arraybuffer";
        }

        if (init && typeof init === "object" && init.headers && typeof init.headers === "object" && !isHeaders(init.headers)) {
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
            const abortFn = () => { aborted = true; xhr.abort(); removeFn(); }
            const removeFn = () => { signal.removeEventListener("abort", abortFn); }
            signal.addEventListener("abort", abortFn);
            xhr.onreadystatechange = () => { if (xhr.readyState === 4) removeFn(); }
        }

        Promise.resolve(payload ? payload.promise : undefined)
            .then(body => {
                if (!aborted) xhr.send(body !== "" ? body : undefined);
                else reject(new DOMExceptionP("The user aborted a request.", "AbortError"));
            })
            .catch(e => {
                console.error(e);
                reject(new TypeError("Failed to fetch"));
            });
    });
}

function parseHeaders(rawHeaders: string): Headers {
    let headers = new HeadersP();
    let preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, " ");

    preProcessedHeaders
        .split("\r")
        .map(header => header.indexOf("\n") === 0 ? header.substring(1, header.length) : header)
        .forEach(line => {
            let parts = line.split(":");
            let name = parts.shift()!.trim();
            if (name) {
                let value = parts.join(":").trim();
                try {
                    headers.append(name, value);
                } catch (e) {
                    console.warn(`SyntaxError: Response.headers: '${name}' is not a valid HTTP header field name.`);
                }
            }
        });

    return headers;
}

const fetchE = (typeof fetch !== "undefined" && fetch) || fetchP;
export { fetchE as fetch };
