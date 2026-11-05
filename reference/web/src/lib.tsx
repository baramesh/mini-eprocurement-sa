// Shared pieces: API client (CNV-03/05/06), formatting rules UIR-01..UIR-03, error display UIR-04.
import { useEffect, useRef, useState } from 'react';

export class ApiErr extends Error {
  constructor(public status: number, public code: string, message: string, public details: { field: string; issue: string }[] = []) { super(message); }
}

const TOKEN = 'token';
export const getToken = () => localStorage.getItem(TOKEN);
export const setToken = (t: string) => localStorage.setItem(TOKEN, t);
export function me(): { sub: number; email: string; roles: string[] } | null {
  const t = getToken(); if (!t) return null;
  try { const p = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); return { sub: Number(p.sub), email: p.email, roles: p.roles ?? [] }; } catch { return null; }
}
export const hasRole = (...r: string[]) => (me()?.roles ?? []).some((x) => r.includes(x));

/** token expired or missing -> authenticate again and come back to this page (every screen, 401 row) */
export function toLogin() {
  localStorage.removeItem(TOKEN);
  location.assign('/login?returnTo=' + encodeURIComponent(location.pathname + location.search));
}

export const newKey = () => crypto.randomUUID();      // UIR-06: one key per user action

export async function api<T = any>(method: string, path: string, body?: unknown, o: { key?: string; ifMatch?: string } = {}): Promise<T> {
  const h: Record<string, string> = { Authorization: `Bearer ${getToken() ?? ''}` };
  if (body !== undefined) h['Content-Type'] = 'application/json';
  if (o.key) h['Idempotency-Key'] = o.key;
  if (o.ifMatch) h['If-Match'] = o.ifMatch;
  let r: Response;
  try { r = await fetch('/api/v1' + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) }); }
  catch { throw new ApiErr(0, 'NETWORK', 'เครือข่ายขัดข้อง'); }
  const text = await r.text();
  const j = text ? JSON.parse(text) : null;
  if (r.status === 401) { toLogin(); throw new ApiErr(401, 'ERR-AUTH-001', j?.message ?? ''); }
  if (!r.ok) throw new ApiErr(r.status, j?.code ?? `HTTP-${r.status}`, j?.message ?? 'ระบบขัดข้อง', j?.details ?? []);
  return j as T;
}

// ---- formats ------------------------------------------------------------------------------------------------
const pad = (n: number, w = 2) => String(n).padStart(w, '0');
/** UIR-01: display Buddhist-era dd/mm/yyyy, keep ISO 8601 on the wire */
export const beDate = (iso?: string | null) => {
  if (!iso) return '';
  const d = iso.length === 10 ? new Date(iso + 'T00:00:00+07:00') : new Date(iso);
  const b = new Date(d.getTime() + 7 * 3600e3);                       // Asia/Bangkok calendar (CNV-02)
  return `${pad(b.getUTCDate())}/${pad(b.getUTCMonth() + 1)}/${b.getUTCFullYear() + 543}`;
};
export const beDateTime = (iso?: string | null) => {
  if (!iso) return '';
  const b = new Date(new Date(iso).getTime() + 7 * 3600e3);
  return `${beDate(iso)} ${pad(b.getUTCHours())}:${pad(b.getUTCMinutes())}`;
};
export const parseBe = (s: string): string | null => {            // 'dd/mm/yyyy' (BE) -> 'YYYY-MM-DD'
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim()); if (!m) return null;
  const y = Number(m[3]) - 543, mo = Number(m[2]), d = Number(m[1]);
  const t = new Date(Date.UTC(y, mo - 1, d)); if (t.getUTCFullYear() !== y || t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== d) return null;
  return `${y}-${pad(mo)}-${pad(d)}`;
};
export const todayIso = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
export const toBeInput = (iso: string) => beDate(iso);
/** UIR-02: thousands separator, 2 decimals */
export const baht = (n?: number | null) => (n == null ? '' : Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
export const num = (n: number) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 3 });
export const round2 = (x: number) => Math.round((x + Number.EPSILON) * 100) / 100;
export const chars = (s: string) => [...s.normalize('NFC')].length;      // CNV-02

// ---- components ---------------------------------------------------------------------------------------------
const COLORS: Record<string, string> = { DRAFT: '#555', SUBMITTED: '#0b5cad', APPROVED: '#1a7f37', IN_SOURCING: '#8250df', ORDERED: '#9a6700', CLOSED: '#444', CANCELLED: '#b42318', OPEN: '#0b5cad', AWARD_PENDING: '#9a6700', AWARDED: '#1a7f37', ISSUED: '#0b5cad', PARTIALLY_RECEIVED: '#9a6700', RECEIVED: '#1a7f37', ACTIVE: '#1a7f37', SUSPENDED: '#b42318', PENDING: '#9a6700', REJECTED: '#b42318' };
export const Badge = ({ s }: { s: string }) => <span data-status={s} style={{ background: COLORS[s] ?? '#555', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{s}</span>;   // UIR-03: colour plus text
export const Money = ({ v }: { v?: number | null }) => <span style={{ display: 'block', textAlign: 'right' }}>{baht(v)}</span>;
export const Err = ({ children }: { children?: React.ReactNode }) => (children ? <div role="alert" style={{ color: '#b42318' }}>{children}</div> : null);

export function useAsync<T>(fn: () => Promise<T>, deps: any[]) {
  const [state, set] = useState<{ loading: boolean; data?: T; error?: ApiErr }>({ loading: true });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    set((s) => ({ ...s, loading: true, error: undefined }));
    fn().then((data) => live && set({ loading: false, data }), (error) => live && set((s) => ({ loading: false, data: s.data, error })));
    return () => { live = false; };
  }, [...deps, tick]);
  return { ...state, reload: () => setTick((t) => t + 1) };
}

export function useDebounced<T>(v: T, ms: number) {
  const [d, setD] = useState(v);
  const t = useRef<any>();
  useEffect(() => { clearTimeout(t.current); t.current = setTimeout(() => setD(v), ms); return () => clearTimeout(t.current); }, [v, ms]);
  return d;
}

/** error panel shared by screens: 403 no-permission page, 404 not found, 5xx banner with retry (UIX state tables) */
export function Problem({ e, retry }: { e?: ApiErr; retry?: () => void }) {
  if (!e) return null;
  if (e.status === 403) return <div role="alert"><h2>ไม่มีสิทธิ์เข้าถึง</h2><p>{e.message}</p></div>;
  if (e.status === 404) return <div role="alert"><h2>ไม่พบเอกสาร</h2></div>;
  return <div role="alert" style={{ background: '#fee', padding: 8 }}>{e.message || 'ระบบขัดข้อง'} {retry && <button onClick={retry}>ลองใหม่</button>}</div>;
}

// UIR-04: the Thai `message` of the response, shown at every field named in details[]
export const fieldErr = (e: ApiErr | undefined, name: string) => (e?.details?.some((d) => d.field === name) ? e.message : undefined);
export const errText = (e: ApiErr) => e.message + (e.details?.length ? ' (' + e.details.map((d) => `${d.field}: ${d.issue}`).join('; ') + ')' : '');
