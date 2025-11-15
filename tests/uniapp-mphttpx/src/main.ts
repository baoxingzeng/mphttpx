// @ts-ignore
import Vue from 'vue'
import App from './App.vue'
import './uni.promisify.adaptor'

Vue.config.productionTip = false

const app = new (typeof App === 'function' ? App : Vue.extend(Object.assign({ mpType: 'app' }, App)))
app.$mount();

// @ts-check
// import {
//     TextEncoderP as TextEncoder,
//     TextDecoderP as TextDecoder,

//     EventP as Event,
//     EventTargetP as EventTarget,
//     CustomEventP as CustomEvent,
//     ProgressEventP as ProgressEvent,

//     BlobP as Blob,
//     FileP as File,
//     FileReaderP as FileReader,

//     URLSearchParamsP as URLSearchParams,
//     FormDataP as FormData,

//     AbortControllerP as AbortController,
//     AbortSignalP as AbortSignal,

//     XMLHttpRequestP as XMLHttpRequest,
//     fetchP as fetch,
//     HeadersP as Headers,
//     RequestP as Request,
//     ResponseP as Response,
// } from "../../../src";

// console.log(TextEncoder);
// console.log(TextDecoder);

// console.log(Event);
// console.log(EventTarget);
// console.log(CustomEvent);
// console.log(ProgressEvent);

// console.log(Blob);
// console.log(File);
// console.log(FileReader);

// console.log(URLSearchParams);
// console.log(FormData);

// console.log(AbortController);
// console.log(AbortSignal);

// console.log(XMLHttpRequest);
// console.log(fetch);
// console.log(Headers);
// console.log(Request);
// console.log(Response);
