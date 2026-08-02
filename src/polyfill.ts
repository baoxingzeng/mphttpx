export * from "./index";
import { TextEncoderP } from "fetch-xhr-shim";
import { TextDecoderP } from "fetch-xhr-shim";

import { EventTargetP } from "fetch-xhr-shim";
import { EventP } from "fetch-xhr-shim";
import { CustomEventP } from "fetch-xhr-shim";

import { AbortControllerP } from "fetch-xhr-shim";
import { AbortSignalP } from "fetch-xhr-shim";

import { BlobP } from "fetch-xhr-shim";
import { FileP } from "fetch-xhr-shim";
import { FileReaderP } from "fetch-xhr-shim";

import { URLSearchParamsP } from "fetch-xhr-shim";
import { FormDataP } from "fetch-xhr-shim";

import { fetchP } from "./fetchP";
import { HeadersP } from "fetch-xhr-shim";
import { RequestP } from "fetch-xhr-shim";
import { ResponseP } from "fetch-xhr-shim";

import { getPlatform } from "miniprogram-platform";

import { XMLHttpRequestP } from "miniprogram-xmlhttprequest-shim";
import { WebSocketP } from "miniprogram-websocket";

import { fixFetch, fixXMLHttpRequest, fixWebSocket } from "fetch-xhr-shim";

/* eslint-disable no-prototype-builtins */
const g: typeof globalThis =
    (typeof globalThis !== "undefined" && globalThis) ||
    (typeof window !== "undefined" && window) ||
    (typeof self !== "undefined" && self) ||
    // @ts-ignore eslint-disable-next-line no-undef
    (typeof global !== "undefined" && global) ||
    {};

// @ts-ignore
if (!g.mp) {
    let platform = getPlatform();
    if (platform) {
        // @ts-ignore
        g.mp = platform.mp;
    }
}

if (!g.fetch) {
    g.fetch = fetchP;
    if (!g.Headers) { g.Headers = HeadersP; }
    if (!g.Request) { g.Request = RequestP; }
    if (!g.Response) { g.Response = ResponseP; }
} else {
    if (!g.Blob || !g.FormData) {
        g.fetch = fixFetch();
    }
}

if (typeof XMLHttpRequest !== "undefined" && XMLHttpRequest) {
    if (!g.Blob || !g.FormData) {
        fixXMLHttpRequest();
    }
}

if (typeof WebSocket !== "undefined" && WebSocket) {
    if (!g.Blob) {
        fixWebSocket();
    }
}

if (!g.TextEncoder) { g.TextEncoder = TextEncoderP; }
if (!g.TextDecoder) { g.TextDecoder = TextDecoderP; }

if (!g.EventTarget) {
    g.EventTarget = EventTargetP;
    if (!g.Event) { g.Event = EventP; }
    if (!g.CustomEvent) { g.CustomEvent = CustomEventP; }
}

if (!g.AbortController) { g.AbortController = AbortControllerP; }
if (!g.AbortSignal) { g.AbortSignal = AbortSignalP; }

if (!g.FileReader) {
    g.FileReader = FileReaderP;
    if (!g.Blob) { g.Blob = BlobP; }
    if (!g.File) { g.File = FileP; }
}

if (!g.URLSearchParams) { g.URLSearchParams = URLSearchParamsP; }
if (!g.FormData) { g.FormData = FormDataP; }

if (!g.XMLHttpRequest) { g.XMLHttpRequest = XMLHttpRequestP; }
if (!g.WebSocket) { g.WebSocket = WebSocketP; }
