// @ts-nocheck
import type { TRequestFunc } from "./request";
import type { TConnectSocketFunc } from "./connectSocket";

/** @internal */
export function getPlatform() {
    let u = "undefined", r = "request", f = "function";
    let mp: { request: TRequestFunc, connectSocket: TConnectSocketFunc };

    mp =
        (typeof wx !== u && typeof wx?.[r] === f && wx) ||        // 微信
        (typeof my !== u && typeof my?.[r] === f && my) ||        // 支付宝
        (typeof qq !== u && typeof qq?.[r] === f && qq) ||        // QQ
        (typeof jd !== u && typeof jd?.[r] === f && jd) ||        // 京东
        (typeof swan !== u && typeof swan?.[r] === f && swan) ||  // 百度
        (typeof tt !== u && typeof tt?.[r] === f && tt) ||        // 抖音 | 飞书
        (typeof ks !== u && typeof ks?.[r] === f && ks) ||        // 快手
        (typeof qh !== u && typeof qh?.[r] === f && qh) ||        // 360
        (typeof xhs !== u && typeof xhs?.[r] === f && xhs) ||     // 小红书
        undefined;

    if (typeof XMLHttpRequest === f && typeof WebSocket === f) {
        return;
    }

    if (mp === undefined) mp = 
        (typeof uni !== u && typeof uni?.[r] === f && uni) ||     // UniApp
        (typeof Taro !== u && typeof Taro?.[r] === f && Taro) ||  // Taro
        undefined;

    return mp;
}
