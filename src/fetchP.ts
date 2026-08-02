import { XMLHttpRequest } from "miniprogram-xmlhttprequest-shim";
import { fetch, fetchP, setXMLHttpRequestClass } from "fetch-xhr-shim";

const fetches = /*#__PURE__*/function () {
    // Mini Program requires explicit XHR assignment,
    // otherwise the polyfill won't be picked up.
    setXMLHttpRequestClass(XMLHttpRequest);
    return [fetch /* global */, fetchP /* polyfill */] as const;
}();

const fetchE = /*#__PURE__*/function () { return fetches[0]; }();
const fetchPolyfill = /*#__PURE__*/function () { return fetches[1]; }();

export { fetchE as fetch };
export { fetchPolyfill as fetchP };
