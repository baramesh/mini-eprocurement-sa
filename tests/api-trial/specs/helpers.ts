import { APIRequestContext, expect } from '@playwright/test';
import crypto from 'node:crypto';
import fs from 'node:fs';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { parse } from 'yaml';


// Test profile (CNV-10): HS256 token signed with the shared test secret; claims per CNV-03.
const SECRET = process.env.TEST_JWT_SECRET ?? 'test-secret-test-secret-test-secret-0123';
const AUDIENCE = 'eprocurement';
const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
const signJwt = (claims: Record<string, unknown>) => {
  const body = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(claims)}`;
  return `${body}.${crypto.createHmac('sha256', SECRET).update(body).digest('base64url')}`;
};

// Personas = rows of sql/sample-data.sql (app_user). Token claims: CNV-03; test profile: CNV-10.
export const P = {
  admin:     { email: 'admin@example.test', roles: ['ADMIN'] },
  reqA:      { email: 'somchai.req@example.test', roles: ['REQUESTER'], id: 2 },
  apprA:     { email: 'somying.appr@example.test', roles: ['DEPT_APPROVER'], id: 3 },
  proc:      { email: 'wichai.proc@example.test', roles: ['PROCUREMENT'], id: 4 },
  head:      { email: 'pranee.head@example.test', roles: ['PROCUREMENT_HEAD'], id: 5 },
  committee: { email: 'committee@example.test', roles: ['COMMITTEE'], id: 6 },
  recv:      { email: 'suda.recv@example.test', roles: ['RECEIVER'], id: 7 },
  reqB:      { email: 'thana.req@example.test', roles: ['REQUESTER'], id: 8 },
  apprB:     { email: 'manee.appr@example.test', roles: ['DEPT_APPROVER'], id: 9 },
  // AC-04-01 needs a user who is both approver and requester; app_user has one role_code, so the claim carries several roles (CNV-03)
  dualA:     { email: 'somchai.req@example.test', roles: ['REQUESTER', 'DEPT_APPROVER'], id: 2 },
} as const;
export type Persona = keyof typeof P;

// ---- contract check: every response of every test is validated against api/openapi.yaml ----
const spec: any = parse(fs.readFileSync(new URL('../../../api/openapi.yaml', import.meta.url), 'utf8'));
const ajv = new (Ajv as any)({ strict: false, allErrors: true, validateFormats: true });
(addFormats as any)(ajv);
ajv.addFormat('int64', true);
const deref = (n: any): any => {
  if (Array.isArray(n)) return n.map(deref);
  if (n && typeof n === 'object') {
    if (n.$ref) return deref(n.$ref.split('/').slice(1).reduce((o: any, k: string) => o[k], spec));
    const o: any = {};
    for (const [k, v] of Object.entries(n)) o[k] = deref(v);
    if (o.nullable && o.type) { o.type = [o.type, 'null']; }
    for (const [flag, lim] of [['exclusiveMinimum', 'minimum'], ['exclusiveMaximum', 'maximum']] as const) {  // OAS 3.0 boolean form -> JSON Schema number form
      if (o[flag] === true) { o[flag] = o[lim]; delete o[lim]; } else if (o[flag] === false) delete o[flag];
    }
    return o;
  }
  return n;
};
const ops = Object.entries(spec.paths).flatMap(([p, item]: any) => Object.entries(item).filter(([m]) => m !== 'parameters').map(([m, o]: any) => ({
  method: m.toUpperCase(), re: new RegExp('^' + p.replace(/\{\w+\}/g, '\\d+') + '$'), op: o,
})));
export const contractErrors: string[] = [];
const validators: Record<string, any> = {};
function checkContract(method: string, path: string, status: number, body: any) {
  const clean = '/' + path.replace(/^\//, '').split('?')[0];
  const hit = ops.find((o) => o.method === method && o.re.test(clean));
  if (!hit) return;                                                  // __test hooks
  const resp = hit.op.responses[String(status)];
  if (!resp) { contractErrors.push(`${method} ${clean}: status ${status} is not documented in OpenAPI`); return; }
  const schema = resp.content?.['application/json']?.schema ?? deref(resp)?.content?.['application/json']?.schema;
  if (!schema) return;
  const k = `${method} ${hit.re.source} ${status}`;
  const v = (validators[k] ||= ajv.compile(deref(schema)));
  if (!v(body)) contractErrors.push(`${method} ${clean} ${status}: ` + ajv.errorsText(v.errors, { separator: '; ' }).slice(0, 300));
}

export const token = (who: Persona, over: Record<string, unknown> = {}) =>
  signJwt({ email: P[who].email, roles: P[who].roles, aud: AUDIENCE, exp: Math.floor(Date.now() / 1000) + 3600, ...over });

let taxSeq = 0;                      // module level: tests create many vendors, taxId must stay unique across tests
export type Res = { status: number; body: any };

export function client(request: APIRequestContext) {
  const call = async (who: Persona | null, method: string, path: string, body?: unknown, headers: Record<string, string> = {}, over: Record<string, unknown> = {}): Promise<Res> => {
    const h: Record<string, string> = { ...headers };
    if (who) h.authorization = `Bearer ${token(who, over)}`;
    if (method !== 'GET' && !h['idempotency-key'] && h['idempotency-key'] !== '') h['idempotency-key'] = crypto.randomUUID();
    const r = await request.fetch(path.startsWith('/__test') ? path : path.replace(/^\//, ''), { method, headers: h, data: body as any });
    const text = await r.text();
    const res = { status: r.status(), body: text ? JSON.parse(text) : null };
    checkContract(method, path, res.status, res.body);
    return res;
  };
  const ok = async (who: Persona, method: string, path: string, body?: unknown, headers?: Record<string, string>) => {
    const r = await call(who, method, path, body, headers);
    expect(r.status, `${method} ${path} -> ${JSON.stringify(r.body)}`).toBeLessThan(300);
    return r.body;
  };

  const tomorrow = () => new Date(Date.now() + 86400e3 + 7 * 3600e3).toISOString().slice(0, 10);   // Bangkok calendar (CNV-02)

  const api = {
    call, ok,
    reset: () => ok('admin', 'POST', '/__test/reset'),
    flushIdempotency: () => ok('admin', 'POST', '/__test/flush-idempotency'),

    prInput: (total: number, qty = 1, extra: Record<string, unknown> = {}) => ({
      title: 'ทดสอบ', justification: 'เพื่อการทดสอบ', neededByDate: tomorrow(),
      items: [{ description: 'รายการ', quantity: qty, unit: 'ชุด', estUnitPrice: Math.round((total / qty) * 100) / 100 }], ...extra,
    }),
    createPr: async (who: Persona, total: number, qty = 1) => (await ok(who, 'POST', '/purchase-requests', api.prInput(total, qty))),
    submit: (who: Persona, prId: number, key?: string) => call(who, 'POST', `/purchase-requests/${prId}/submit`, undefined, key ? { 'idempotency-key': key } : {}),
    getPr: (who: Persona, prId: number) => ok(who, 'GET', `/purchase-requests/${prId}`),

    /** submit and approve every step with the matching persona -> APPROVED PR */
    approvedPr: async (total: number, qty = 1, requester: Persona = 'reqA') => {
      const pr = await api.createPr(requester, total, qty);
      const sub = await ok(requester, 'POST', `/purchase-requests/${pr.prId}/submit`);
      const who: Record<string, Persona> = { DEPT_APPROVER: requester === 'reqB' ? 'apprB' : 'apprA', PROCUREMENT_HEAD: 'head', COMMITTEE: 'committee' };
      for (const a of sub.approvals) await ok(who[a.requiredRole], 'POST', `/approvals/${a.approvalId}/decision`, { decision: 'APPROVED' });
      return api.getPr(requester, pr.prId);
    },
    newVendor: async (name = 'ผู้ขายทดสอบ') =>
      ok('proc', 'POST', '/vendors', { nameTh: `${name} ${taxSeq}`, taxId: String((Date.now() % 1e10) * 1000 + (++taxSeq % 1000)).padStart(13, '0'), email: `v${taxSeq}@vendor.example.test` }),
    vendors: async (n: number) => { const v = []; for (let i = 0; i < n; i++) v.push(await api.newVendor()); return v; },
    dueIn: (ms: number) => new Date(Date.now() + ms).toISOString(),

    /** RFQ with 3 invited vendors on a fresh APPROVED PR */
    rfq: async (total = 30000, dueMs = 3600e3) => {
      const pr = await api.approvedPr(total);
      const vs = await api.vendors(3);
      const rfq = await ok('proc', 'POST', '/rfqs', { prId: pr.prId, dueAt: api.dueIn(dueMs), vendorIds: vs.map((v: any) => v.vendorId) });
      return { pr, vs, rfq };
    },
    quote: (rfqId: number, vendorId: number, prItemId: number, unitPrice: number) =>
      call('proc', 'POST', `/rfqs/${rfqId}/quotations`, { vendorId, leadTimeDays: 7, items: [{ prItemId, unitPrice }] }),
    /** direct-purchase PO (<= 5,000) ISSUED */
    issuedPo: async (total: number, qty: number, prefix: Persona = 'reqA') => {
      const pr = await api.approvedPr(total, qty, prefix);
      const v = await api.newVendor();
      const po = await ok('proc', 'POST', '/purchase-orders', { prId: pr.prId, vendorId: v.vendorId });
      return { pr, v, po: await ok('proc', 'POST', `/purchase-orders/${po.poId}/issue`) };
    },
    audit: (entity: string, id: number) => ok('admin', 'GET', `/audit-logs?entity=${entity}&entityId=${id}`),
  };
  return api;
}
