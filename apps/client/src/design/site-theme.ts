/**
 * CSS injected into the sandboxed site iframe. Two concerns live here:
 * 1) making the generated fictional websites look like real products
 * 2) the highlight-state classes the parent app toggles live while the
 *    player types, entirely via DOM mutation (no scripts run in the frame).
 */
export const SITE_THEME_CSS = `
:root { color-scheme: dark; }
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #0d1119;
  color: #e7ebf3;
  font-size: 14px;
  line-height: 1.5;
}
button { font-family: inherit; cursor: pointer; }
input { font-family: inherit; }

.btn {
  border: 1px solid rgba(255,255,255,0.14);
  background: #1a2130;
  color: #e7ebf3;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  transition: background 0.15s, border-color 0.15s;
}
.btn:hover { background: #222b3f; }
.btn-primary { background: #2f6fed; border-color: #2f6fed; color: white; }
.btn-primary:hover { background: #3b7cff; }
.btn-link { background: transparent; border: none; color: #7fb1ff; font-weight: 500; }
.btn.disabled { opacity: 0.4; cursor: not-allowed; }

.search-input, input[type], .login-form input {
  background: #131a28;
  border: 1px solid rgba(255,255,255,0.12);
  color: #e7ebf3;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  outline: none;
}
.search-input:focus, input:focus { border-color: #2f6fed; }

/* ---- storefront ---- */
.storefront { min-height: 100%; }
.site-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 14px 24px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  background: #10151f;
}
.brand { font-weight: 800; letter-spacing: 0.02em; color: #7fb1ff; margin-right: 8px; }
.nav-links { display: flex; gap: 16px; flex: 1; }
.nav-link { color: #97a2ba; text-decoration: none; font-size: 13px; font-weight: 500; }
.nav-link:hover { color: #e7ebf3; }
.search-input { width: 200px; }
.cart-icon { background: #1a2130; }

.catalog { padding: 24px; }
.category { margin-bottom: 28px; }
.category h2 { font-size: 15px; color: #97a2ba; margin: 0 0 12px; font-weight: 600; }
.products { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
.product-card {
  background: #131a28;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}
.product-card.featured { border-color: rgba(127,177,255,0.4); }
.product-name { margin: 0; font-size: 14px; font-weight: 600; }
.price { font-size: 15px; font-weight: 700; color: #7fb1ff; }
.badge { align-self: flex-start; font-size: 11px; padding: 2px 8px; border-radius: 999px; font-weight: 600; }
.badge-in-stock { background: rgba(61,220,151,0.15); color: #3ddc97; }
.badge-sold-out { background: rgba(255,92,114,0.15); color: #ff5c72; }
.badge-low-stock { background: rgba(255,180,84,0.15); color: #ffb454; }
.badge-preorder { background: rgba(155,139,255,0.15); color: #9b8bff; }
.buy-btn { margin-top: auto; }

.site-footer { display: flex; gap: 16px; padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.08); }
.footer-link { color: #5c657c; font-size: 12px; text-decoration: none; }

/* ---- directory ---- */
.directory { padding: 20px; }
.toolbar { display: flex; gap: 10px; margin-bottom: 16px; }
.member-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.member-table th { text-align: left; color: #5c657c; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.1); }
.member-table td { padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); vertical-align: middle; }
.member-name { font-weight: 600; }
.member-email { color: #97a2ba; }
.role-badge { font-size: 11px; padding: 2px 8px; border-radius: 999px; font-weight: 600; background: rgba(127,177,255,0.15); color: #7fb1ff; }
.status-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 6px; }
.status-dot.online { background: #3ddc97; }
.status-dot.offline { background: #5c657c; }
.actions-cell { display: flex; gap: 6px; }
.action { padding: 5px 10px; font-size: 12px; border-radius: 6px; }
.action.danger { color: #ff5c72; border-color: rgba(255,92,114,0.3); }

/* ---- form ---- */
.login-form { padding: 28px; max-width: 340px; }
.field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
.field label { font-size: 12px; color: #97a2ba; font-weight: 600; }
.form-actions { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
.checkout-actions { display: flex; gap: 10px; padding: 24px; }

/* ---- highlight states (toggled from the parent app) ---- */
[data-xa-highlight="match"] {
  outline: 2px solid #ffb454 !important;
  outline-offset: 2px;
  border-radius: 6px;
  animation: xa-pulse 1.1s ease-in-out infinite;
}
[data-xa-highlight="wrong"] {
  outline: 2px solid #ff5c72 !important;
  outline-offset: 2px;
  border-radius: 6px;
}
[data-xa-highlight="target"] {
  outline: 2px solid #3ddc97 !important;
  outline-offset: 3px;
  border-radius: 6px;
  box-shadow: 0 0 0 5px rgba(61,220,151,0.15), 0 0 24px rgba(61,220,151,0.35);
  position: relative;
  z-index: 5;
  animation: xa-lock 0.4s ease-out;
}
@keyframes xa-pulse {
  0%, 100% { outline-color: #ffb454; }
  50% { outline-color: rgba(255,180,84,0.4); }
}
@keyframes xa-lock {
  0% { outline-color: rgba(61,220,151,0); box-shadow: 0 0 0 0 rgba(61,220,151,0); transform: scale(1.02); }
  100% { outline-color: #3ddc97; transform: scale(1); }
}
`;

export function buildFrameDocument(bodyHtml: string): string {
  return `<!doctype html><html><head><meta charset="utf-8" /><style>${SITE_THEME_CSS}</style></head><body>${bodyHtml}</body></html>`;
}
