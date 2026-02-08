// HTTP methods whose capitalization should be normalized
const methods = ["CONNECT", "DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT", "TRACE"];

/** @internal */
export function normalizeMethod(method: string) {
    let upcased = method.toUpperCase();
    return methods.indexOf(upcased) > -1 ? upcased : method;
}
