/** @internal */
export function attachFn<
    T extends EventTarget & Record<`on${K}`, ((ev: any) => any) | null>,
    K extends string,
>(
    target: T,
    handlers: Record<`on${K}`, (ev: any) => void>
) {
    return function attach(type: K) {
        const fnName = ("on" + type) as `on${K}`;
        const callback = target[fnName];
        const listener = handlers[fnName] as EventListener;

        typeof callback === "function"
            ? target.addEventListener(type, listener)
            : target.removeEventListener(type, listener);
    }
}

/** @internal */
export function executeFn(target: EventTarget, cb: Function | null, ev: Event) {
    if (typeof cb === "function") cb.call(target, ev);
}
