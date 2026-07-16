import { onRequestOptions as __api_register_js_onRequestOptions } from "/home/zoop/Code/verifi/functions/api/register.js"
import { onRequestPost as __api_register_js_onRequestPost } from "/home/zoop/Code/verifi/functions/api/register.js"
import { onRequestOptions as __ping_js_onRequestOptions } from "/home/zoop/Code/verifi/functions/ping.js"
import { onRequestPost as __ping_js_onRequestPost } from "/home/zoop/Code/verifi/functions/ping.js"
import { onRequestOptions as __pow_verify_js_onRequestOptions } from "/home/zoop/Code/verifi/functions/pow-verify.js"
import { onRequestPost as __pow_verify_js_onRequestPost } from "/home/zoop/Code/verifi/functions/pow-verify.js"
import { onRequestGet as __stats_js_onRequestGet } from "/home/zoop/Code/verifi/functions/stats.js"
import { onRequestOptions as __stats_js_onRequestOptions } from "/home/zoop/Code/verifi/functions/stats.js"
import { onRequestOptions as __token_js_onRequestOptions } from "/home/zoop/Code/verifi/functions/token.js"
import { onRequestPost as __token_js_onRequestPost } from "/home/zoop/Code/verifi/functions/token.js"
import { onRequestOptions as __verify_js_onRequestOptions } from "/home/zoop/Code/verifi/functions/verify.js"
import { onRequestPost as __verify_js_onRequestPost } from "/home/zoop/Code/verifi/functions/verify.js"

export const routes = [
    {
      routePath: "/api/register",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_register_js_onRequestOptions],
    },
  {
      routePath: "/api/register",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_register_js_onRequestPost],
    },
  {
      routePath: "/ping",
      mountPath: "/",
      method: "OPTIONS",
      middlewares: [],
      modules: [__ping_js_onRequestOptions],
    },
  {
      routePath: "/ping",
      mountPath: "/",
      method: "POST",
      middlewares: [],
      modules: [__ping_js_onRequestPost],
    },
  {
      routePath: "/pow-verify",
      mountPath: "/",
      method: "OPTIONS",
      middlewares: [],
      modules: [__pow_verify_js_onRequestOptions],
    },
  {
      routePath: "/pow-verify",
      mountPath: "/",
      method: "POST",
      middlewares: [],
      modules: [__pow_verify_js_onRequestPost],
    },
  {
      routePath: "/stats",
      mountPath: "/",
      method: "GET",
      middlewares: [],
      modules: [__stats_js_onRequestGet],
    },
  {
      routePath: "/stats",
      mountPath: "/",
      method: "OPTIONS",
      middlewares: [],
      modules: [__stats_js_onRequestOptions],
    },
  {
      routePath: "/token",
      mountPath: "/",
      method: "OPTIONS",
      middlewares: [],
      modules: [__token_js_onRequestOptions],
    },
  {
      routePath: "/token",
      mountPath: "/",
      method: "POST",
      middlewares: [],
      modules: [__token_js_onRequestPost],
    },
  {
      routePath: "/verify",
      mountPath: "/",
      method: "OPTIONS",
      middlewares: [],
      modules: [__verify_js_onRequestOptions],
    },
  {
      routePath: "/verify",
      mountPath: "/",
      method: "POST",
      middlewares: [],
      modules: [__verify_js_onRequestPost],
    },
  ]