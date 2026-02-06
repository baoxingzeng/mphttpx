/** @internal */
export class Method {
    // HTTP methods whose capitalization should be normalized
    static methods = ["CONNECT", "DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT", "TRACE"];
    static normalizeMethod(method: string) {
        let upcased = method.toUpperCase();
        return Method.methods.indexOf(upcased) > -1 ? upcased : method;
    }
}
