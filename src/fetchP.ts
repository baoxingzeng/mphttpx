import { XMLHttpRequest } from "miniprogram-xmlhttprequest-shim";
import { fetch, fetchP, setXMLHttpRequestClass } from "fetch-xhr-shim";

const fetches = (function () {
    setXMLHttpRequestClass(XMLHttpRequest);
    return [fetch, fetchP] as const;
})();

const fetchE = fetches[0];
const fetchPolyfill = fetches[1];

export { fetchE as fetch };
export { fetchPolyfill as fetchP };
export { setXMLHttpRequestClass, setXMLHttpRequestClass as setXMLHttpRequest };
