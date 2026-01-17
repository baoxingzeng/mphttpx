import { mp } from "./platform";

export const connectSocket = mp ? mp.connectSocket : function errorConnectSocket(options: IConnectSocketOption): ISocketTask {
    return {
        send(obj) { },
        close(obj) { },
        onOpen(listener) { },
        onMessage(listener) { },

        onError(listener) {
            if (typeof listener === "function") {
                listener({ errMsg: "NOT_SUPPORTED_ERR" });
            }
        },

        onClose(listener) {
            if (typeof listener === "function") {
                setTimeout(() => { listener({ code: 3009, reason: "NOT_SUPPORTED_ERR" }); });
            }
        },
    };
};

/**
 * 创建一个 WebSocket 连接。
 */
export type TConnectSocketFunc = (options: IConnectSocketOption) => ISocketTask;

export interface IConnectSocketOption {
    /** 开发者服务器 wss 接口地址 */
    url: string;

    /** HTTP Header，Header 中不能设置 Referer */
    header?: object;

    /** 子协议数组 */
    protocols?: string[];

    /** 建立 TCP 连接的时候的 TCP_NODELAY 设置 */
    tcpNoDelay?: boolean;

    /** 是否开启压缩扩展 */
    perMessageDeflate?: boolean;

    /** 超时时间，单位为毫秒 */
    timeout?: number;

    /** 强制使用蜂窝网络发送请求 */
    forceCellularNetwork?: boolean;

    /** 支付宝：是否多实例。 */
    multiple?: boolean;

    /** 接口调用成功的回调函数 */
    success?: Function;

    /** 接口调用失败的回调函数 */
    fail?: Function;

    /** 接口调用结束的回调函数（调用成功、失败都会执行） */
    complete?: Function;
};

export interface ISocketTask {
    send: (obj: { data: string | ArrayBuffer; success?: Function; fail?: Function; complete?: Function; }) => void;
    close: (obj: { code?: number | undefined; reason?: string | undefined; success?: Function; fail?: Function; complete?: Function; }) => void;
    onOpen: (listener: (res: { header: object, profile: ISocketProfile }) => void) => void;
    onClose: (listener: (res: { code: number; reason: string }) => void) => void;
    onError: (listener: (res: { errMsg: string }) => void) => void;
    onMessage: (listener: (res: { data: string | ArrayBuffer | { data: string; isBuffer: boolean } }) => void) => void;
};

interface ISocketProfile {
    /** 组件准备好使用 SOCKET 建立请求的时间，这发生在检查本地缓存之前 */
    fetchStart: number;

    /** DNS 域名查询开始的时间，如果使用了本地缓存（即无 DNS 查询）或持久连接，则与 fetchStart 值相等 */
    domainLookUpStart: number;

    /** DNS 域名查询完成的时间，如果使用了本地缓存（即无 DNS 查询）或持久连接，则与 fetchStart 值相等 */
    domainLookUpEnd: number;

    /** 开始建立连接的时间，如果是持久连接，则与 fetchStart 值相等。注意如果在传输层发生了错误且重新建立连接，则这里显示的是新建立的连接开始的时间 */
    connectStart: number;

    /** 完成建立连接的时间（完成握手），如果是持久连接，则与 fetchStart 值相等。注意如果在传输层发生了错误且重新建立连接，则这里显示的是新建立的连接完成的时间。注意这里握手结束，包括安全连接建立完成、SOCKS 授权通过 */
    connectEnd: number;

    /** 单次连接的耗时，包括 connect ，tls */
    rtt: number;

    /** 握手耗时 */
    handshakeCost: number;

    /** 上层请求到返回的耗时 */
    cost: number;
};
