// @ts-ignore
import Vue from 'vue'
import App from './App.vue'
import './uni.promisify.adaptor'

Vue.config.productionTip = false

const app = new (typeof App === 'function' ? App : Vue.extend(Object.assign({ mpType: 'app' }, App)))
app.$mount();

// import { TextEncoderP as TextEncoder } from '../../../src/index'
// console.log(TextEncoder);
// console.log(new TextEncoder());

// import { TextDecoderP as TextDecoder } from '../../../src/index'
// console.log(TextDecoder);
// console.log(new TextDecoder());

// import { BlobP as Blob } from '../../../src/index'
// console.log(Blob);
// console.log(new Blob());

// import { FileP as File } from '../../../src/index'
// console.log(File);
// console.log(new File([], "file.txt"));

// import { FileReaderP as FileReader } from '../../../src/index'
// console.log(FileReader);
// console.log(new FileReader());

// import { URLSearchParamsP as URLSearchParams } from '../../../src/index'
// console.log(URLSearchParams);
// console.log(new URLSearchParams());

// import { FormDataP as FormData } from '../../../src/index'
// console.log(FormData);
// console.log(new FormData());

// import { fetchP as fetch } from '../../../src/index'
// console.log(fetch);
// console.log(fetch("http://localhost:3000/ping"));

// import { HeadersP as Headers } from '../../../src/index'
// console.log(Headers);
// console.log(new Headers());

// import { RequestP as Request } from '../../../src/index'
// console.log(Request);
// console.log(new Request("http://localhost:3000"));

// import { ResponseP as Response } from '../../../src/index'
// console.log(Response);
// console.log(new Response(""));

// import { AbortControllerP as AbortController } from '../../../src/index'
// console.log(AbortController);
// console.log(new AbortController());

// import { AbortSignalP as AbortSignal } from '../../../src/index'
// console.log(AbortSignal);
// console.log((new AbortController()).signal);

// import { EventTargetP as EventTarget } from '../../../src/index'
// console.log(EventTarget);
// console.log(new EventTarget());

// import { EventP as Event } from '../../../src/index'
// console.log(Event);
// console.log(new Event("click"));

// import { CustomEventP as CustomEvent } from '../../../src/index'
// console.log(CustomEvent);
// console.log(new CustomEvent("click"));

// import { XMLHttpRequestP as XMLHttpRequest } from '../../../src/index'
// console.log(XMLHttpRequest);
// console.log(new XMLHttpRequest());

// import { WebSocketP as WebSocket } from '../../../src/index'
// console.log(WebSocket);
// console.log(new WebSocket("ws://localhost:3001"));
