/** Self-contained password screen (no app code or data is sent before sign-in). */
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export const SECURITY_HEADERS: Record<string, string> = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
};

export function gatePage({ next = '/', error, configError }: { next?: string; error?: string; configError?: string }): string {
  const body = configError
    ? `<p class="msg">This site is locked because its password is not configured.</p><p class="small">${esc(configError)}</p>`
    : `<form method="post" action="/api/login" autocomplete="on">
        <input type="hidden" name="next" value="${esc(next)}">
        <input type="text" name="username" value="rank-orbit" autocomplete="username" hidden>
        <label for="pw">Password</label>
        <input id="pw" name="password" type="password" autocomplete="current-password" required autofocus maxlength="256">
        ${error ? `<p class="err" role="alert">${esc(error)}</p>` : ''}
        <div class="row"><span class="small">Private · authorised access only</span>
          <button type="submit"><span class="l">Enter</span><span class="c" aria-hidden="true"><svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1.5 5h7M5.5 2l3 3-3 3"/></svg></span></button>
        </div>
      </form>`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Rank Orbit · Private</title>
<style>
*{box-sizing:border-box;border-radius:0}
html{-webkit-font-smoothing:antialiased}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F4F4F2;color:#0A0A0A;font:14px/1.5 "Inter Tight","Helvetica Neue",Helvetica,Arial,sans-serif;padding:20px}
main{width:100%;max-width:420px}
.mark{display:flex;align-items:center;gap:10px;margin-bottom:40px;font-size:10.5px;color:#8C8C8C}
h1{margin:0;font-size:64px;line-height:.92;letter-spacing:-.055em;font-weight:500}
form,.box{margin-top:40px;border-top:1px solid #E3E3E0;padding-top:32px;display:flex;flex-direction:column;gap:8px}
label{font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:#8C8C8C}
input[type=password]{height:40px;border:1px solid #E3E3E0;background:#fff;padding:0 12px;font:inherit;font-size:14px;color:#0A0A0A}
input[type=password]:focus{outline:1.5px solid #E1251B;outline-offset:0;border-color:#0A0A0A}
.row{display:flex;align-items:center;justify-content:space-between;border-top:1px solid #E3E3E0;margin-top:20px;padding-top:20px}
.small{font-size:10.5px;color:#8C8C8C}
.err{margin:6px 0 0;font-size:12px;color:#C0262D}
.msg{margin:0;font-size:15px}
button{display:inline-flex;gap:2px;height:32px;padding:0;border:0;background:none;cursor:pointer;font:inherit;font-size:11px;font-weight:500}
button .l{display:flex;align-items:center;padding:0 14px;background:#0A0A0A;color:#fff}
button .c{display:flex;align-items:center;justify-content:center;width:32px;border:1px solid #0A0A0A;background:#fff;color:#0A0A0A}
button:hover .c{background:#E1251B;border-color:#E1251B;color:#fff}
button:focus-visible{outline:1.5px solid #E1251B;outline-offset:2px}
</style></head>
<body><main>
<div class="mark"><svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true"><rect width="8" height="8" fill="#E1251B"/><rect x="10" width="8" height="8" fill="none" stroke="#E1251B" stroke-width="1.5"/><rect y="10" width="8" height="8" fill="none" stroke="#E1251B" stroke-width="1.5"/><path d="M10 10h8v8" fill="none" stroke="#E1251B" stroke-width="1.5"/></svg>Private workspace</div>
<h1>Rank Orbit</h1>
${configError ? `<div class="box">${body}</div>` : body}
</main></body></html>`;
}
