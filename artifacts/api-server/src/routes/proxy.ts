import { Router } from "express";

const router = Router();

const BLOCKED_REQ_HEADERS = new Set([
  "host", "origin", "referer", "cookie", "authorization",
  "x-forwarded-for", "x-forwarded-host", "x-forwarded-proto",
]);

const BLOCKED_RES_HEADERS = new Set([
  "x-frame-options",
  "content-security-policy",
  "content-security-policy-report-only",
  "x-content-type-options",
  "strict-transport-security",
  "cross-origin-opener-policy",
  "cross-origin-embedder-policy",
  "cross-origin-resource-policy",
  "access-control-allow-origin",
  "transfer-encoding",
]);

const MOBILE_UA =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";

function toAbsolute(url: string, base: string): string {
  try {
    return new URL(url, base).href;
  } catch {
    return url;
  }
}

function injectProxyShim(html: string, targetUrl: string): string {
  const origin = new URL(targetUrl).origin;

  const baseTag = `<base href="${targetUrl}">`;

  const shim = `<script>
(function(){
  var _proxy='/api/proxy?url=';
  function px(u){
    if(!u||u==='#'||u.startsWith('javascript:')|| u.startsWith('mailto:')|| u.startsWith('data:')) return u;
    if(u.startsWith(_proxy)) return u;
    try{ return _proxy+encodeURIComponent(new URL(u,document.baseURI).href); }catch(e){ return u; }
  }
  /* Intercept <a> clicks */
  document.addEventListener('click',function(e){
    var a=e.target&&e.target.closest?e.target.closest('a'):null;
    if(!a) return;
    var href=a.getAttribute('href');
    if(!href||href.startsWith('javascript:')||href.startsWith('mailto:')) return;
    e.preventDefault();
    e.stopPropagation();
    var abs;
    try{ abs=new URL(href,document.baseURI).href; }catch(er){ return; }
    window.top.postMessage({type:'eon-navigate',url:abs},'*');
  },true);
  /* Intercept <form> submit */
  document.addEventListener('submit',function(e){
    var form=e.target;
    if(!form) return;
    e.preventDefault();
    var action=form.action||document.baseURI;
    var method=(form.method||'GET').toUpperCase();
    if(method==='GET'){
      var params=new URLSearchParams(new FormData(form));
      var url=action.split('?')[0]+'?'+params.toString();
      window.top.postMessage({type:'eon-navigate',url:url},'*');
    }
  },true);
  /* Push/replace state — notify parent */
  var _push=history.pushState.bind(history);
  var _replace=history.replaceState.bind(history);
  history.pushState=function(s,t,u){ _push(s,t,u); if(u) window.top.postMessage({type:'eon-urlchange',url:new URL(u,document.baseURI).href},'*'); };
  history.replaceState=function(s,t,u){ _replace(s,t,u); if(u) window.top.postMessage({type:'eon-urlchange',url:new URL(u,document.baseURI).href},'*'); };
  window.addEventListener('popstate',function(){ window.top.postMessage({type:'eon-urlchange',url:location.href},'*'); });
})();
</script>`;

  if (html.includes("<head>")) {
    return html.replace("<head>", `<head>${baseTag}${shim}`);
  }
  if (html.includes("<html")) {
    return html.replace(/(<html[^>]*>)/i, `$1<head>${baseTag}${shim}</head>`);
  }
  return baseTag + shim + html;
}

router.get("/proxy", async (req, res) => {
  const rawUrl = req.query["url"] as string | undefined;
  if (!rawUrl) {
    res.status(400).json({ error: "url query parameter is required" });
    return;
  }

  let targetUrl: string;
  try {
    targetUrl = decodeURIComponent(rawUrl);
    new URL(targetUrl);
  } catch {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }

  const fetchHeaders: Record<string, string> = {
    "User-Agent": MOBILE_UA,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "identity",
    "Cache-Control": "no-cache",
  };

  // Forward safe request headers
  for (const [k, v] of Object.entries(req.headers)) {
    if (!BLOCKED_REQ_HEADERS.has(k.toLowerCase()) && typeof v === "string") {
      fetchHeaders[k] = v;
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      headers: fetchHeaders,
      redirect: "follow",
    });
  } catch (err) {
    req.log.warn({ err, targetUrl }, "Proxy fetch failed");
    res.status(502).json({ error: "Failed to reach the target site" });
    return;
  }

  // Forward response headers, stripping the ones that block framing
  for (const [k, v] of upstream.headers.entries()) {
    if (!BLOCKED_RES_HEADERS.has(k.toLowerCase())) {
      res.setHeader(k, v);
    }
  }

  // Allow this response to be framed by us
  res.removeHeader("X-Frame-Options");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const contentType = upstream.headers.get("content-type") ?? "";

  if (contentType.includes("text/html")) {
    const raw = await upstream.text();
    const patched = injectProxyShim(raw, targetUrl);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.removeHeader("content-length");
    res.status(upstream.status).send(patched);
  } else {
    // Binary / CSS / JS — stream through as-is
    const body = await upstream.arrayBuffer();
    res.status(upstream.status).send(Buffer.from(body));
  }
});

export default router;
