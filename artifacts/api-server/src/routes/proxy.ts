import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

/* ─── Headers ──────────────────────────────────────────────────── */

const DROP_REQ_HEADERS = new Set([
  "host", "origin", "referer", "cookie", "authorization",
  "x-forwarded-for", "x-forwarded-host", "x-forwarded-proto",
  "if-none-match", "if-modified-since",
]);

const DROP_RES_HEADERS = new Set([
  "x-frame-options",
  "content-security-policy",
  "content-security-policy-report-only",
  "strict-transport-security",
  "cross-origin-opener-policy",
  "cross-origin-embedder-policy",
  "cross-origin-resource-policy",
  "access-control-allow-origin",
  "access-control-allow-credentials",
  "transfer-encoding",
  "content-encoding",
]);

const MOBILE_UA =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";

/* ─── URL helpers ──────────────────────────────────────────────── */

const PROXY_PATH = "/api/proxy?url=";

function px(url: string): string {
  return PROXY_PATH + encodeURIComponent(url);
}

function resolve(href: string, base: string): string | null {
  href = href.trim();
  if (
    !href ||
    href.startsWith("javascript:") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("data:") ||
    href.startsWith("#") ||
    href.startsWith(PROXY_PATH)
  ) return null;
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

/* ─── HTML rewriting ───────────────────────────────────────────── */

function rewriteAttr(
  html: string,
  tag: string,
  attr: string,
  base: string,
): string {
  // Match the attribute inside the specified tag (case-insensitive)
  const tagRe = new RegExp(`(<${tag}[^>]*?)\\s${attr}=(["\'])([^"\']*?)\\2`, "gi");
  return html.replace(tagRe, (_m, before, q, val) => {
    const abs = resolve(val, base);
    return abs ? `${before} ${attr}=${q}${px(abs)}${q}` : _m;
  });
}

function rewriteSrcset(html: string, base: string): string {
  return html.replace(
    /srcset=(["\'])([^"\']+)\1/gi,
    (_m, q, val) => {
      const rewritten = val.replace(/([^\s,]+)(\s[^,]*)?/g, (_part: string, url: string, descriptor = "") => {
        const abs = resolve(url, base);
        return abs ? px(abs) + descriptor : url + descriptor;
      });
      return `srcset=${q}${rewritten}${q}`;
    },
  );
}

function rewriteMetaRefresh(html: string, base: string): string {
  return html.replace(
    /(<meta[^>]+http-equiv=["']?refresh["']?[^>]+content=["'])([^"'>]*)(['"][^>]*>)/gi,
    (_m, before, content, after) => {
      const urlMatch = content.match(/url=(.+)/i);
      if (!urlMatch) return _m;
      const abs = resolve(urlMatch[1], base);
      return abs
        ? `${before}${content.replace(urlMatch[1], px(abs))}${after}`
        : _m;
    },
  );
}

function rewriteHtml(html: string, base: string): string {
  // Remove existing base tags so ours wins
  html = html.replace(/<base[^>]*>/gi, "");

  // Attributes on specific elements
  html = rewriteAttr(html, "a", "href", base);
  html = rewriteAttr(html, "area", "href", base);
  html = rewriteAttr(html, "form", "action", base);
  html = rewriteAttr(html, "link", "href", base);
  html = rewriteAttr(html, "script", "src", base);
  html = rewriteAttr(html, "img", "src", base);
  html = rewriteAttr(html, "source", "src", base);
  html = rewriteAttr(html, "video", "src", base);
  html = rewriteAttr(html, "audio", "src", base);
  html = rewriteAttr(html, "track", "src", base);
  html = rewriteAttr(html, "embed", "src", base);
  html = rewriteAttr(html, "iframe", "src", base);
  html = rewriteAttr(html, "input", "src", base);
  html = rewriteSrcset(html, base);
  html = rewriteMetaRefresh(html, base);

  return html;
}

/* ─── CSS rewriting ─────────────────────────────────────────────── */

function rewriteCss(css: string, base: string): string {
  return css.replace(/url\((['"]?)([^)'"]+)\1\)/gi, (_m, q, val) => {
    const abs = resolve(val, base);
    return abs ? `url(${q}${px(abs)}${q})` : _m;
  });
}

/* ─── JS shim injected into every HTML page ─────────────────────── */

function buildShim(base: string): string {
  const origin = (() => { try { return new URL(base).origin; } catch { return base; } })();
  return `<script>
(function(){
var _P='/api/proxy?url=';
function px(u){
  if(!u||u==='#'||u.startsWith('javascript:')||u.startsWith('mailto:')||u.startsWith('data:')||u.startsWith(_P)) return u;
  try{ return _P+encodeURIComponent(new URL(u,'${base}').href); }catch(e){ return u; }
}
/* ── Fetch ── */
var _fetch=window.fetch.bind(window);
window.fetch=function(input,init){
  if(typeof input==='string') input=px(input);
  else if(input instanceof Request){ input=new Request(px(input.url),input); }
  return _fetch(input,init);
};
/* ── XHR ── */
var _XHRopen=XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open=function(m,u){
  var args=Array.from(arguments);
  args[1]=px(String(u));
  return _XHRopen.apply(this,args);
};
/* ── Navigation via location ── */
function nav(u){
  var abs;try{ abs=new URL(u,'${base}').href; }catch(e){ return; }
  window.top.postMessage({type:'eon-navigate',url:abs},'*');
}
var _loc=Object.getOwnPropertyDescriptor(window,'location');
try{
  Object.defineProperty(window,'location',{
    get:function(){ return _loc?_loc.get.call(this):location; },
    set:function(v){ nav(String(v)); }
  });
}catch(e){}
/* ── Link clicks ── */
document.addEventListener('click',function(e){
  var el=e.target&&e.target.closest?e.target.closest('a'):null;
  if(!el) return;
  var href=el.getAttribute('href');
  if(!href||href.startsWith('javascript:')||href.startsWith('mailto:')||href.startsWith('#')) return;
  e.preventDefault(); e.stopPropagation();
  var abs;try{ abs=new URL(href,'${base}').href; }catch(er){ return; }
  window.top.postMessage({type:'eon-navigate',url:abs},'*');
},true);
/* ── Form submit ── */
document.addEventListener('submit',function(e){
  var form=e.target; if(!form) return;
  e.preventDefault();
  var action=form.getAttribute('action')||'${base}';
  var method=(form.method||'GET').toUpperCase();
  var params=new URLSearchParams(new FormData(form));
  var abs;try{ abs=new URL(action,'${base}').href; }catch(er){ return; }
  if(method==='GET'){
    window.top.postMessage({type:'eon-navigate',url:abs+'?'+params},'*');
  }
},true);
/* ── pushState / replaceState ── */
var _ps=history.pushState.bind(history);
var _rs=history.replaceState.bind(history);
history.pushState=function(s,t,u){ _ps(s,t,u); if(u) window.top.postMessage({type:'eon-urlchange',url:new URL(String(u),'${base}').href},'*'); };
history.replaceState=function(s,t,u){ _rs(s,t,u); if(u) window.top.postMessage({type:'eon-urlchange',url:new URL(String(u),'${base}').href},'*'); };
window.addEventListener('popstate',function(){ window.top.postMessage({type:'eon-urlchange',url:location.href},'*'); });
/* ── window.open ── */
window.open=function(u){ if(u) window.top.postMessage({type:'eon-navigate',url:new URL(String(u),'${base}').href},'*'); return null; };
})();
</script>`;
}

/* ─── Fetch helpers ─────────────────────────────────────────────── */

async function proxyFetch(
  targetUrl: string,
  req: Request,
): Promise<Response> {
  const headers: Record<string, string> = {
    "User-Agent": MOBILE_UA,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "identity",
    "Cache-Control": "no-cache",
  };

  for (const [k, v] of Object.entries(req.headers)) {
    if (!DROP_REQ_HEADERS.has(k.toLowerCase()) && typeof v === "string") {
      headers[k] = v;
    }
  }

  return fetch(targetUrl, { headers, redirect: "follow" });
}

/* ─── Route ─────────────────────────────────────────────────────── */

router.get("/proxy", async (req: Request, res: Response) => {
  const raw = req.query["url"] as string | undefined;
  if (!raw) {
    res.status(400).json({ error: "url query parameter is required" });
    return;
  }

  let targetUrl: string;
  try {
    targetUrl = decodeURIComponent(raw);
    new URL(targetUrl); // validate
  } catch {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }

  let upstream: Response;
  try {
    upstream = await proxyFetch(targetUrl, req);
  } catch (err) {
    req.log.warn({ err, targetUrl }, "Proxy fetch failed");
    res.status(502).json({ error: "Failed to reach the target site" });
    return;
  }

  // Strip blocking headers
  for (const [k, v] of upstream.headers.entries()) {
    if (!DROP_RES_HEADERS.has(k.toLowerCase())) {
      res.setHeader(k, v);
    }
  }
  res.removeHeader("X-Frame-Options");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  const contentType = upstream.headers.get("content-type") ?? "";
  const finalUrl = upstream.url || targetUrl;

  if (contentType.includes("text/html")) {
    let html = await upstream.text();

    // Rewrite resource URLs
    html = rewriteHtml(html, finalUrl);

    // Inject our <base> tag and shim just after <head> (or at top)
    const injection = `<base href="${finalUrl}">${buildShim(finalUrl)}`;
    if (html.includes("<head>")) {
      html = html.replace("<head>", `<head>${injection}`);
    } else if (/<html/i.test(html)) {
      html = html.replace(/(<html[^>]*>)/i, `$1<head>${injection}</head>`);
    } else {
      html = injection + html;
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.removeHeader("content-length");
    res.status(upstream.status).send(html);

  } else if (contentType.includes("text/css")) {
    const css = await upstream.text();
    const rewritten = rewriteCss(css, finalUrl);
    res.setHeader("Content-Type", "text/css; charset=utf-8");
    res.removeHeader("content-length");
    res.status(upstream.status).send(rewritten);

  } else {
    // Binary: images, fonts, JS, etc. — stream through unchanged
    const body = await upstream.arrayBuffer();
    res.removeHeader("content-length");
    res.status(upstream.status).send(Buffer.from(body));
  }
});

export default router;
