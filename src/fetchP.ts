import { XMLHttpRequest } from "miniprogram-xmlhttprequest-shim";
import { fetch, fetchP, setXMLHttpRequestClass } from "fetch-xhr-shim";

const fetches = /*#__PURE__*/function () {
    setXMLHttpRequestClass(XMLHttpRequest);
    return [fetch, fetchP] as const;
}();

const fetchE = /*#__PURE__*/function () { return fetches[0]; }();
const fetchPolyfill = /*#__PURE__*/function () { return fetches[1]; }();

export { fetchE as fetch };
export { fetchPolyfill as fetchP };
