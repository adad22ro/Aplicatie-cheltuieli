import type { NextConfig } from "next";

// URL-ul Supabase trebuie permis explicit în CSP (connect-src) pentru fetch-urile de auth/date.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseOrigin = (() => {
  try {
    return supabaseUrl ? new URL(supabaseUrl).origin : "";
  } catch {
    return "";
  }
})();

/**
 * Content-Security-Policy pragmatic pentru Next 16 + Supabase + PWA.
 * - `script-src`/`style-src` includ `'unsafe-inline'` fiindcă Next injectează scripturi de
 *   hidratare inline (fără nonce) și Tailwind folosește stiluri inline; un CSP cu nonce ar
 *   cere refactor de middleware. `connect-src` permite doar self + Supabase.
 * - `frame-ancestors 'none'` = anti-clickjacking. `object-src 'none'`.
 */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  `connect-src 'self' ${supabaseOrigin}`.trim(),
  "worker-src 'self'",
  "manifest-src 'self'",
]
  .filter(Boolean)
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // HSTS: forțează HTTPS 2 ani, inclusiv subdomenii (Vercel servește oricum doar HTTPS).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
