import { XMLHttpRequestImpl as XMLHttpRequestMP } from "./mini-program/XMLHttpRequestImpl";

export const XMLHttpRequestP = XMLHttpRequestMP;

const XMLHttpRequestE = (typeof XMLHttpRequest !== "undefined" && XMLHttpRequest) || XMLHttpRequestP;
export { XMLHttpRequestE as XMLHttpRequest };
