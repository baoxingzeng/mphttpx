/** @internal */
export function isSequence(value: unknown): value is any[] {
    return Array.isArray(value) || (!!value
        && typeof value === "object"
        && typeof Symbol === "function"
        && Symbol.iterator
        && Symbol.iterator in value
        && typeof (value as (object & Record<typeof Symbol.iterator, unknown>))[Symbol.iterator] === "function");
}
