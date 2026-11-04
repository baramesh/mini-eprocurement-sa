// Reference implementation written ONLY from the published design documents
// (runtime views V-03..V-14, OpenAPI, business rules, sql/sample-data.sql users).
// In-memory on purpose: the goal is to prove the documents are enough to build from.
// Gaps found while building this are listed in design/00-overview/findings/fnd-19 and were resolved in the documents; hooks follow CNV-10.
import http from 'node:http';
import crypto from 'node:crypto';

export const JWT_SECRET = 'dev-secret';      // CNV-03 / CNV-10
export const AUDIENCE = 'eprocurement';

const USERS = [ // sql/sample-data.sql app_user (id, dept, name, email, role)
  [1, 1, 'ผู้ดูแลระบบ', 'admin@example.test', 'ADMIN'],
  [2, 1, 'สมชาย ผู้ขอซื้อ', 'somchai.req@example.test', 'REQUESTER'],
  [3, 1, 'สมหญิง ผู้อนุมัติฝ่ายไอที', 'somying.appr@example.test', 'DEPT_APPROVER'],
  [4, 3, 'วิชัย เจ้าหน้าที่จัดซื้อ', 'wichai.proc@example.test', 'PROCUREMENT'],
  [5, 3, 'ปราณี หัวหน้าจัดซื้อ', 'pranee.head@example.test', 'PROCUREMENT_HEAD'],
  [6, 3, 'กรรมการ พิจารณา', 'committee@example.test', 'COMMITTEE'],
  [7, 1, 'สุดา ผู้รับของ', 'suda.recv@example.test', 'RECEIVER'],
  [8, 2, 'ธนา ผู้ขอซื้อฝ่ายปฏิบัติการ', 'thana.req@example.test', 'REQUESTER'],
  [9, 2, 'มานี ผู้อนุมัติฝ่ายปฏิบัติการ', 'manee.appr@example.test', 'DEPT_APPROVER'],
].map(([id, dept, name, email, role]) => ({ id, dept, name, email, role, active: true }));
const DEPTS = { 1: 'ไอที', 2: 'ปฏิบัติการ', 3: 'การเงินและบัญชี' };

const ALL = ['REQUESTER', 'DEPT_APPROVER', 'PROCUREMENT', 'PROCUREMENT_HEAD', 'COMMITTEE', 'ADMIN'];
const APPROVERS = ['DEPT_APPROVER', 'PROCUREMENT_HEAD', 'COMMITTEE'];

let S;
function reset() {
  S = { pr: [], item: [], appr: [], rfq: [], rfqVendor: [], quo: [], quoItem: [], award: [], po: [], poItem: [], gr: [], grItem: [],
        vendor: [], audit: [], seq: {}, idem: new Map(), version: 0 };
}
reset();
const nextId = (k) => (S.seq[k] = (S.seq[k] || 0) + 1);
const docNo = (p) => `${p}-${new Date().getUTCFullYear()}-${String(nextId('no' + p)).padStart(5, '0')}`;
const money = (x) => Math.round((x + Number.EPSILON) * 100) / 100;   // CNV-02: half-up
const line = (q, p) => money(Math.round(q * p * 1e6) / 1e6);
let clock = null;                                  // CNV-10: X-Test-Now overrides the clock for the current request
const nowMs = () => (clock ? Date.parse(clock) : Date.now());
const nowIso = () => new Date(nowMs()).toISOString();
const bkkDay = (iso) => new Date(Date.parse(iso) + 7 * 3600e3).toISOString().slice(0, 10);   // CNV-02: dates are Asia/Bangkok calendar days
const bkkMonth = (iso) => bkkDay(iso).slice(0, 7);

class Err extends Error { constructor(status, code, message, details) { super(message); Object.assign(this, { status, code, details }); } }
const E = (s, c, m, d) => new Err(s, c, m, d);
const val = (field, issue) => E(422, 'ERR-VAL-001', 'ข้อมูลไม่ถูกต้อง', [{ field, issue }]);

function audit(actor, entity, entityId, action, detail) {
  S.audit.push({ auditId: nextId('audit'), entity, entityId, action, actorId: actor.id, detail: detail || '', createdAt: nowIso() });
}

// ---- auth (V-06) ----------------------------------------------------------------
const b64 = (b) => Buffer.from(b).toString('base64url');
export function signJwt(claims) {
  const h = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' })), p = b64(JSON.stringify(claims));
  const s = crypto.createHmac('sha256', JWT_SECRET).update(`${h}.${p}`).digest('base64url');
  return `${h}.${p}.${s}`;
}
function authenticate(req, allowedRoles) {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
  if (!m) throw E(401, 'ERR-AUTH-001', 'ไม่มี token');
  const [h, p, s] = m[1].split('.');
  if (!s) throw E(401, 'ERR-AUTH-001', 'token ไม่ถูกต้อง');
  const exp = crypto.createHmac('sha256', JWT_SECRET).update(`${h}.${p}`).digest('base64url');
  if (exp !== s) throw E(401, 'ERR-AUTH-001', 'ลายเซ็นไม่ถูกต้อง');
  const c = JSON.parse(Buffer.from(p, 'base64url').toString());
  if (c.aud !== AUDIENCE || !(c.exp > Date.now() / 1000)) throw E(401, 'ERR-AUTH-001', 'token หมดอายุ');
  const u = S.users.find((x) => x.email === c.email && x.active);
  if (!u) throw E(403, 'ERR-AUTH-002', 'ไม่พบผู้ใช้');
  const roles = c.roles || [];
  if (!roles.some((r) => allowedRoles.includes(r))) throw E(403, 'ERR-AUTH-002', 'บทบาทไม่อนุญาต');
  return { ...u, roles };                                             // CNV-03: roles come from the claim
}
S.users = USERS;
const resetAll = () => { const u = USERS; reset(); S.users = u; };

// ---- helpers --------------------------------------------------------------------
const prScopeOk = (u, pr) => {
  if (u.roles.includes('REQUESTER') && !u.roles.some((r) => !['REQUESTER'].includes(r))) return pr.requesterId === u.id;
  if (u.roles.includes('DEPT_APPROVER') && u.roles.every((r) => ['REQUESTER', 'DEPT_APPROVER'].includes(r)) && !u.roles.includes('REQUESTER')) return pr.deptId === u.dept;
  if (u.roles.includes('REQUESTER') && u.roles.includes('DEPT_APPROVER')) return pr.requesterId === u.id || pr.deptId === u.dept;
  return true;
};
const user = (id) => S.users.find((x) => x.id === id);
function prOut(pr) {
  const items = S.item.filter((i) => i.prId === pr.id).sort((a, b) => a.lineNo - b.lineNo);
  const rfq = S.rfq.filter((r) => r.prId === pr.id).sort((a, b) => b.id - a.id)[0];
  const po = S.po.find((p) => p.prId === pr.id && p.status !== 'CANCELLED');
  return {
    prId: pr.id, prNo: pr.no, status: pr.status, title: pr.title, neededByDate: pr.neededByDate, totalEstimated: pr.total,
    requesterName: user(pr.requesterId).name, departmentName: DEPTS[pr.deptId], submittedAt: pr.submittedAt || null,
    rfqId: rfq ? rfq.id : null, poId: po ? po.id : null, justification: pr.justification, rowVersion: pr.rowVersion,
    items: items.map((i) => ({ description: i.description, quantity: i.quantity, unit: i.unit, estUnitPrice: i.estUnitPrice, prItemId: i.id, lineNo: i.lineNo })),
    approvals: S.appr.filter((a) => a.docType === 'PR' && a.docId === pr.id && !a.superseded).sort((a, b) => a.stepNo - b.stepNo).map(apprOut),
  };
}
const apprOut = (a) => ({ approvalId: a.id, docType: a.docType, docId: a.docId, stepNo: a.stepNo, requiredRole: a.requiredRole, decision: a.decision, comment: a.comment ?? null, decidedAt: a.decidedAt ?? null });
const bump = (pr) => { pr.rowVersion = (++S.version).toString(16).padStart(16, '0'); };

function parsePrInput(b) {
  const bad = [];
  if (typeof b.title !== 'string' || !b.title || b.title.length > 200) bad.push(['title', 'required, max 200']);
  if (typeof b.justification !== 'string' || !b.justification || b.justification.length > 1000) bad.push(['justification', 'required, max 1000']);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.neededByDate || '') || b.neededByDate < bkkDay(nowIso())) bad.push(['neededByDate', 'date not before today']);
  if (!Array.isArray(b.items) || b.items.length < 1 || b.items.length > 100) bad.push(['items', 'minItems: 1, maxItems: 100']);
  else b.items.forEach((it, i) => {
    if (typeof it.description !== 'string' || !it.description || it.description.length > 300) bad.push([`items[${i}].description`, 'required, max 300']);
    if (!(typeof it.quantity === 'number' && it.quantity > 0)) bad.push([`items[${i}].quantity`, 'exclusiveMinimum: 0']);
    if (typeof it.unit !== 'string' || !it.unit || it.unit.length > 30) bad.push([`items[${i}].unit`, 'required, max 30']);
    if (!(typeof it.estUnitPrice === 'number' && it.estUnitPrice >= 0)) bad.push([`items[${i}].estUnitPrice`, 'minimum: 0']);
  });
  if (bad.length) throw E(422, 'ERR-VAL-001', 'ข้อมูลไม่ถูกต้อง', bad.map(([field, issue]) => ({ field, issue })));
}
function writeItems(pr, items) {
  S.item = S.item.filter((i) => i.prId !== pr.id);
  items.forEach((it, n) => S.item.push({ id: nextId('item'), prId: pr.id, lineNo: n + 1, ...it }));
  pr.total = money(items.reduce((s, it) => s + line(it.quantity, it.estUnitPrice), 0));
}
const approvalChain = (total) => (total <= 20000 ? ['DEPT_APPROVER'] : total <= 200000 ? ['DEPT_APPROVER', 'PROCUREMENT_HEAD'] : ['DEPT_APPROVER', 'PROCUREMENT_HEAD', 'COMMITTEE']);

function poOut(po) {
  const v = S.vendor.find((x) => x.id === po.vendorId);
  const items = S.poItem.filter((i) => i.poId === po.id).map((i) => {
    const got = S.grItem.filter((g) => g.poItemId === i.id).reduce((s, g) => s + g.qtyReceived, 0);
    return { poItemId: i.id, prItemId: i.prItemId, description: i.description, unit: i.unit, quantity: i.quantity, unitPrice: i.unitPrice, qtyReceived: got, qtyRemaining: i.quantity - got };
  });
  return { poId: po.id, poNo: po.no, prId: po.prId, vendorId: po.vendorId, totalAmount: po.total, status: po.status, vendorName: v.nameTh, rfqId: po.rfqId ?? null, issuedAt: po.issuedAt ?? null, items };
}
const rfqOut = (r) => ({ rfqId: r.id, rfqNo: r.no, prId: r.prId, status: r.status, dueAt: r.dueAt, vendorIds: S.rfqVendor.filter((x) => x.rfqId === r.id).map((x) => x.vendorId) });
const quoOut = (q) => ({ quotationId: q.id, vendorId: q.vendorId, vendorName: S.vendor.find((v) => v.id === q.vendorId).nameTh, totalAmount: q.total, leadTimeDays: q.leadTimeDays, isActive: q.active, submittedAt: q.submittedAt });
const vendorOut = (v) => ({ nameTh: v.nameTh, taxId: v.taxId, email: v.email, vendorId: v.id, vendorCode: v.code, status: v.status });

// ---- routes ---------------------------------------------------------------------
const routes = [];
const route = (method, path, roles, fn, opts = {}) => {
  const keys = []; const re = new RegExp('^' + path.replace(/\{(\w+)\}/g, (_, k) => (keys.push(k), '(\\d+)')) + '$');
  routes.push({ method, re, keys, roles, fn, ...opts });
};

route('GET', '/purchase-requests', ALL, (u, { query }) => {
  const limit = Math.min(100, Math.max(1, Number(query.limit || 50)));
  let rows = S.pr.filter((p) => prScopeOk(u, p));
  if (query.status) rows = rows.filter((p) => p.status === query.status);
  if (query.requesterId) rows = rows.filter((p) => p.requesterId === Number(query.requesterId));
  if (query.createdFrom) rows = rows.filter((p) => bkkDay(p.createdAt) >= query.createdFrom);
  if (query.createdTo) rows = rows.filter((p) => bkkDay(p.createdAt) <= query.createdTo);
  rows.sort((a, b) => (a.createdAt === b.createdAt ? b.id - a.id : a.createdAt < b.createdAt ? 1 : -1));
  if (query.cursor) { const [, id] = Buffer.from(query.cursor, 'base64').toString().split('|'); const at = rows.findIndex((p) => p.id === Number(id)); rows = rows.slice(at + 1); }
  const page = rows.slice(0, limit);
  const next = rows.length > limit ? Buffer.from(`${page.at(-1).createdAt}|${page.at(-1).id}`).toString('base64') : null;
  return [200, { items: page.map((p) => { const o = prOut(p); delete o.items; delete o.approvals; delete o.justification; delete o.rowVersion; return o; }), nextCursor: next }];
});

route('POST', '/purchase-requests', ['REQUESTER'], (u, { body }) => {
  parsePrInput(body);
  const pr = { id: nextId('pr'), no: docNo('PR'), status: 'DRAFT', title: body.title, justification: body.justification, neededByDate: body.neededByDate,
    requesterId: u.id, deptId: u.dept, createdAt: nowIso() };
  S.pr.push(pr); writeItems(pr, body.items); bump(pr); audit(u, 'PR', pr.id, 'CREATE');
  return [201, prOut(pr)];
}, { idem: true });

const getPr = (u, id) => {
  const pr = S.pr.find((p) => p.id === id);
  if (!pr) throw E(404, 'ERR-NF-001', 'ไม่พบเอกสาร');
  if (!prScopeOk(u, pr)) throw E(404, 'ERR-NF-001', 'ไม่พบเอกสาร');   // V-06 step 4
  return pr;
};
route('GET', '/purchase-requests/{prId}', ALL, (u, { p }) => [200, prOut(getPr(u, p.prId))]);

route('PUT', '/purchase-requests/{prId}', ['REQUESTER'], (u, { p, body, req }) => {
  const pr = getPr(u, p.prId);
  parsePrInput(body);
  const ifm = req.headers['if-match'];
  if (!ifm) throw val('If-Match', 'required');                         // CNV-06
  if (ifm !== pr.rowVersion) throw E(409, 'ERR-CONC-001', 'เอกสารถูกแก้โดยผู้อื่น');
  if (pr.status !== 'DRAFT') throw E(409, 'ERR-STATE-001', 'แก้ไขไม่ได้');
  Object.assign(pr, { title: body.title, justification: body.justification, neededByDate: body.neededByDate });
  writeItems(pr, body.items); bump(pr); audit(u, 'PR', pr.id, 'UPDATE');
  return [200, prOut(pr)];
}, { idem: true });

route('POST', '/purchase-requests/{prId}/submit', ['REQUESTER'], (u, { p }) => {
  const pr = getPr(u, p.prId);
  if (pr.requesterId !== u.id) throw E(404, 'ERR-NF-001', 'ไม่พบเอกสาร');   // V-03 step 2
  if (pr.status !== 'DRAFT') throw E(409, 'ERR-STATE-001', 'ส่งไม่ได้');
    approvalChain(pr.total).forEach((role, i) => S.appr.push({ id: nextId('appr'), docType: 'PR', docId: pr.id, stepNo: i + 1, requiredRole: role, decision: 'PENDING', proposerId: pr.requesterId }));
  pr.status = 'SUBMITTED'; pr.submittedAt = nowIso(); bump(pr); audit(u, 'PR', pr.id, 'SUBMIT', 'ส่งอนุมัติ');
  return [200, prOut(pr)];
}, { idem: true });

const pending = () => S.appr.filter((a) => !a.superseded && a.decision === 'PENDING');
const isCurrent = (a) => !S.appr.some((o) => !o.superseded && o.docType === a.docType && o.docId === a.docId && o.stepNo < a.stepNo && o.decision === 'PENDING');

route('GET', '/approvals', APPROVERS, (u) => {
  const rows = pending().filter((a) => isCurrent(a) && u.roles.includes(a.requiredRole)).map((a) => {
    let docNo_, title, req, amount, at, proposerId;
    if (a.docType === 'PR') { const pr = S.pr.find((x) => x.id === a.docId); docNo_ = pr.no; title = pr.title; req = user(pr.requesterId).name; amount = pr.total; at = pr.submittedAt; proposerId = pr.requesterId; }
    else { const r = S.rfq.find((x) => x.id === a.docId), pr = S.pr.find((x) => x.id === r.prId), aw = S.award.find((x) => x.rfqId === r.id); docNo_ = r.no; title = pr.title; req = user(aw.awardedBy).name; amount = S.quo.find((q) => q.id === aw.quotationId).total; at = aw.createdAt; proposerId = aw.awardedBy; }
    if (a.requiredRole === 'DEPT_APPROVER' && a.docType === 'PR' && S.pr.find((x) => x.id === a.docId).deptId !== u.dept) return null; // V-04 step 1
    return { ...apprOut(a), docNo: docNo_, docTitle: title, requesterName: req, amount, submittedAt: at, proposerId };
  }).filter(Boolean);
  return [200, rows];
});

route('POST', '/approvals/{approvalId}/decision', APPROVERS, (u, { p, body }) => {
  const a = S.appr.find((x) => x.id === p.approvalId && !x.superseded);
  if (!a) throw E(404, 'ERR-NF-001', 'ไม่พบ');
  if (a.docType === 'PR' && a.requiredRole === 'DEPT_APPROVER' && u.roles.every((r) => r !== 'PROCUREMENT_HEAD' && r !== 'COMMITTEE') && S.pr.find((x) => x.id === a.docId).deptId !== u.dept) throw E(404, 'ERR-NF-001', 'ไม่พบ'); // V-04 step 1
  if (!u.roles.includes(a.requiredRole)) throw E(403, 'ERR-AUTH-002', 'บทบาทไม่ตรงขั้น');
  let proposer;
  if (a.docType === 'PR') proposer = S.pr.find((x) => x.id === a.docId).requesterId; else proposer = S.award.find((x) => x.rfqId === a.docId).awardedBy;
  if (proposer === u.id) throw E(403, 'ERR-SOD-001', 'ห้ามอนุมัติของตนเอง');
  if (!['APPROVED', 'REJECTED'].includes(body.decision)) throw val('decision', 'enum');
  if (body.decision === 'REJECTED' && !(body.comment || '').trim()) throw val('comment', 'required when REJECTED');
  if (a.decision !== 'PENDING' || !isCurrent(a)) throw E(409, 'ERR-STATE-001', 'ขั้นนี้ตัดสินไม่ได้'); // V-04 steps 5
  a.decision = body.decision; a.comment = body.comment ?? null; a.decidedAt = nowIso();
  audit(u, a.docType === 'PR' ? 'PR' : 'RFQ', a.docId, body.decision === 'APPROVED' ? 'APPROVE' : 'REJECT', body.comment || `ขั้น ${a.stepNo}`); // CNV-11
  const last = !S.appr.some((o) => !o.superseded && o.docType === a.docType && o.docId === a.docId && o.decision === 'PENDING');
  if (a.docType === 'PR') {
    const pr = S.pr.find((x) => x.id === a.docId);
    if (body.decision === 'REJECTED') { S.appr = S.appr.filter((o) => !(o.docType === 'PR' && o.docId === pr.id)); pr.status = 'DRAFT'; bump(pr); } else if (last) { pr.status = 'APPROVED'; bump(pr); }
  } else {
    const r = S.rfq.find((x) => x.id === a.docId);
    if (body.decision === 'REJECTED') { S.appr = S.appr.filter((o) => !(o.docType === 'AWARD' && o.docId === r.id)); r.status = 'OPEN'; S.award = S.award.filter((x) => x.rfqId !== r.id); } else if (last) r.status = 'AWARDED';
  }
  return [200, apprOut(a)];
}, { idem: true });

route('POST', '/rfqs', ['PROCUREMENT'], (u, { body }) => {
  const pr = S.pr.find((x) => x.id === body.prId);
  if (!pr) throw val('prId', 'not found');
  if (pr.status !== 'APPROVED') throw E(409, 'ERR-STATE-002', 'PR ยังไม่อนุมัติ');
  if (!(pr.total > 5000)) throw E(422, 'ERR-RFQ-006', 'ให้ซื้อตรง');
  const ids = body.vendorIds;
  if (!Array.isArray(ids) || new Set(ids).size !== ids.length || ids.length < 3) throw E(422, 'ERR-RFQ-001', 'ต้องเชิญอย่างน้อย 3 ราย', [{ field: 'vendorIds', issue: 'minItems: 3' }]);
  if (!(Date.parse(body.dueAt) > nowMs())) throw val('dueAt', 'must be in the future');
  if (ids.some((id) => S.vendor.find((v) => v.id === id)?.status !== 'ACTIVE')) throw E(422, 'ERR-VND-002', 'ผู้ขายถูกระงับ');
  const r = { id: nextId('rfq'), no: docNo('RFQ'), prId: pr.id, status: 'OPEN', dueAt: body.dueAt };
  S.rfq.push(r); ids.forEach((vendorId) => S.rfqVendor.push({ rfqId: r.id, vendorId }));
  pr.status = 'IN_SOURCING'; bump(pr); audit(u, 'RFQ', r.id, 'CREATE');
  return [201, rfqOut(r)];
}, { idem: true });

const getRfq = (id) => { const r = S.rfq.find((x) => x.id === id); if (!r) throw E(404, 'ERR-NF-001', 'ไม่พบ RFQ'); return r; };
route('GET', '/rfqs/{rfqId}', ['PROCUREMENT', 'PROCUREMENT_HEAD', 'COMMITTEE'], (u, { p }) => {
  const r = getRfq(p.rfqId), pr = S.pr.find((x) => x.id === r.prId);
  return [200, { ...rfqOut(r), prNo: pr.no, prTitle: pr.title,
    items: S.item.filter((i) => i.prId === pr.id).map((i) => ({ prItemId: i.id, description: i.description, quantity: i.quantity, unit: i.unit })),
    vendors: S.rfqVendor.filter((x) => x.rfqId === r.id).map((x) => ({ vendorId: x.vendorId, vendorName: S.vendor.find((v) => v.id === x.vendorId).nameTh })) }];
});

route('POST', '/rfqs/{rfqId}/quotations', ['PROCUREMENT'], (u, { p, body }) => {
  const r = getRfq(p.rfqId);
  if (r.status !== 'OPEN' || nowMs() > Date.parse(r.dueAt)) throw E(409, 'ERR-RFQ-003', 'เลยกำหนด');
  if (!S.rfqVendor.some((x) => x.rfqId === r.id && x.vendorId === body.vendorId)) throw E(422, 'ERR-RFQ-002', 'ผู้ขายไม่ได้รับเชิญ');
  const prItems = S.item.filter((i) => i.prId === r.prId);
  const given = body.items || [];
  if (given.length !== prItems.length || new Set(given.map((g) => g.prItemId)).size !== given.length || !prItems.every((i) => given.some((g) => g.prItemId === i.id) && true))
    throw val('items', 'must cover every PR item exactly once');
  if (given.some((g) => !(typeof g.unitPrice === 'number' && g.unitPrice >= 0))) throw val('items[].unitPrice', 'minimum: 0');
  S.quo.filter((q) => q.rfqId === r.id && q.vendorId === body.vendorId).forEach((q) => (q.active = false));
  const q = { id: nextId('quo'), rfqId: r.id, vendorId: body.vendorId, leadTimeDays: body.leadTimeDays ?? null, active: true, submittedAt: nowIso(),
    total: money(given.reduce((s, g) => s + line(prItems.find((i) => i.id === g.prItemId).quantity, g.unitPrice), 0)) };
  S.quo.push(q); given.forEach((g) => S.quoItem.push({ quotationId: q.id, prItemId: g.prItemId, unitPrice: g.unitPrice }));
  return [201, quoOut(q)];
}, { idem: true });

const lowest = (rfqId) => S.quo.filter((q) => q.rfqId === rfqId && q.active).sort((a, b) => a.total - b.total || a.id - b.id)[0];
route('GET', '/rfqs/{rfqId}/comparison', ['PROCUREMENT', 'PROCUREMENT_HEAD', 'COMMITTEE'], (u, { p }) => {
  const r = getRfq(p.rfqId);
  const qs = S.quo.filter((q) => q.rfqId === r.id && q.active).sort((a, b) => a.id - b.id);
  return [200, { rfqId: r.id, lowestQuotationId: lowest(r.id)?.id ?? null,
    quotations: qs.map((q) => ({ ...quoOut(q), itemPrices: S.quoItem.filter((x) => x.quotationId === q.id).map((x) => ({ prItemId: x.prItemId, unitPrice: x.unitPrice })) })) }];
});

route('POST', '/rfqs/{rfqId}/award', ['PROCUREMENT'], (u, { p, body }) => {
  const r = getRfq(p.rfqId);
  if (r.status !== 'OPEN') throw E(409, 'ERR-STATE-001', 'RFQ ไม่อยู่ในสถานะเปิด');
  const act = S.quo.filter((q) => q.rfqId === r.id && q.active);
  const win = act.find((q) => q.id === body.quotationId);
  if (act.length < 2 || !win) throw E(422, 'ERR-RFQ-005', 'ต้องมีใบเสนอราคาอย่างน้อย 2 ราย');
  if (win.id !== lowest(r.id).id && [...(body.reason || '').normalize('NFC')].length < 20) throw E(422, 'ERR-RFQ-004', 'ต้องระบุเหตุผล'); // CNV-02: Unicode code points, NFC
  S.award.push({ id: nextId('award'), rfqId: r.id, quotationId: win.id, reason: body.reason ?? null, awardedBy: u.id, createdAt: nowIso() });
  r.status = 'AWARD_PENDING';
  S.appr.push({ id: nextId('appr'), docType: 'AWARD', docId: r.id, stepNo: 1, requiredRole: win.total > 200000 ? 'COMMITTEE' : 'PROCUREMENT_HEAD', decision: 'PENDING' }); // V-10 step 7: doc_id = rfq_id
  audit(u, 'RFQ', r.id, 'AWARD', body.reason || '');
  return [202, rfqOut(r)];
}, { idem: true });

route('POST', '/purchase-orders', ['PROCUREMENT'], (u, { body }) => {
  const pr = S.pr.find((x) => x.id === body.prId);
  if (!pr) throw val('prId', 'not found');
  let vendorId, rfqId = null, price;
  const prItems = S.item.filter((i) => i.prId === pr.id);
  if (body.rfqId == null) {
    if (pr.status !== 'APPROVED') throw E(409, 'ERR-STATE-002', 'PR ยังไม่อนุมัติ');
    if (pr.total > 5000) throw E(422, 'ERR-PO-001', 'เกินวงเงินซื้อตรง');
    if (!body.vendorId) throw val('vendorId', 'required for direct purchase');
    vendorId = body.vendorId; price = (i) => i.estUnitPrice;
  } else {
    const r = S.rfq.find((x) => x.id === body.rfqId);
    if (!r || r.prId !== pr.id) throw val('rfqId', 'not found for this PR');
    if (r.status !== 'AWARDED') throw E(409, 'ERR-STATE-001', 'RFQ ยังไม่ AWARDED');
    const win = S.quo.find((q) => q.id === S.award.find((a) => a.rfqId === r.id).quotationId);
    vendorId = win.vendorId; rfqId = r.id; price = (i) => S.quoItem.find((x) => x.quotationId === win.id && x.prItemId === i.id).unitPrice;
  }
  if (S.vendor.find((v) => v.id === vendorId)?.status !== 'ACTIVE') throw E(422, 'ERR-VND-002', 'ผู้ขายถูกระงับ');
  const po = { id: nextId('po'), no: docNo('PO'), prId: pr.id, vendorId, rfqId, status: 'DRAFT', total: money(prItems.reduce((s, i) => s + line(i.quantity, price(i)), 0)) };
  S.po.push(po); prItems.forEach((i) => S.poItem.push({ id: nextId('poItem'), poId: po.id, prItemId: i.id, description: i.description, unit: i.unit, quantity: i.quantity, unitPrice: price(i) }));
  pr.status = 'ORDERED'; bump(pr); audit(u, 'PO', po.id, 'CREATE');
  return [201, poOut(po)];
}, { idem: true });

const getPo = (id) => { const x = S.po.find((p) => p.id === id); if (!x) throw E(404, 'ERR-NF-001', 'ไม่พบ PO'); return x; };
route('GET', '/purchase-orders/{poId}', ['PROCUREMENT', 'PROCUREMENT_HEAD', 'RECEIVER', 'ADMIN'], (u, { p }) => [200, poOut(getPo(p.poId))]);
route('POST', '/purchase-orders/{poId}/issue', ['PROCUREMENT'], (u, { p }) => {
  const po = getPo(p.poId);
  if (po.status !== 'DRAFT') throw E(409, 'ERR-STATE-001', 'ออกไม่ได้');
  if (S.vendor.find((v) => v.id === po.vendorId).status !== 'ACTIVE') throw E(422, 'ERR-VND-002', 'ผู้ขายถูกระงับ');
  po.status = 'ISSUED'; po.issuedAt = nowIso(); audit(u, 'PO', po.id, 'ISSUE');
  return [200, poOut(po)];
}, { idem: true });

route('POST', '/purchase-orders/{poId}/receipts', ['RECEIVER'], (u, { p, body }) => {
  const po = getPo(p.poId);
  if (!['ISSUED', 'PARTIALLY_RECEIVED'].includes(po.status)) throw E(409, 'ERR-STATE-001', 'รับของไม่ได้');
  const items = body.items || [];
  const mine = S.poItem.filter((i) => i.poId === po.id);
  if (!items.length || new Set(items.map((i) => i.poItemId)).size !== items.length || items.some((i) => !mine.some((m) => m.id === i.poItemId)) || !items.some((i) => i.qtyReceived > 0))
    throw val('items', 'invalid');
  const gotNow = (m) => S.grItem.filter((g) => g.poItemId === m.id).reduce((s, g) => s + g.qtyReceived, 0);
  for (const it of items) { const m = mine.find((x) => x.id === it.poItemId); if (gotNow(m) + it.qtyReceived > m.quantity) throw E(422, 'ERR-GR-001', 'รับเกินจำนวนสั่ง'); }
  const gr = { id: nextId('gr'), no: docNo('GR'), poId: po.id };
  S.gr.push(gr); items.forEach((it) => S.grItem.push({ grId: gr.id, poItemId: it.poItemId, qtyReceived: it.qtyReceived, qtyRejected: it.qtyRejected || 0 }));
  const done = mine.every((m) => gotNow(m) === m.quantity);
  po.status = done ? 'RECEIVED' : 'PARTIALLY_RECEIVED';
  if (done) { const pr = S.pr.find((x) => x.id === po.prId); pr.status = 'CLOSED'; bump(pr); }
  audit(u, 'PO', po.id, 'RECEIVE');
  return [201, { grId: gr.id, grNo: gr.no, poStatus: po.status }];
}, { idem: true });

route('GET', '/vendors', ['PROCUREMENT', 'PROCUREMENT_HEAD', 'ADMIN'], (u, { query }) => {
  let rows = S.vendor;
  if (query.q) rows = rows.filter((v) => [v.nameTh, v.code, v.taxId].some((f) => f.includes(query.q)));
  if (query.status) rows = rows.filter((v) => v.status === query.status);
  return [200, rows.sort((a, b) => a.code.localeCompare(b.code)).map(vendorOut)];
});
route('POST', '/vendors', ['PROCUREMENT'], (u, { body }) => {
  if (typeof body.nameTh !== 'string' || !body.nameTh) throw val('nameTh', 'required');
  if (!/^\d{13}$/.test(body.taxId || '')) throw val('taxId', 'pattern: 13 digits');
  if (S.vendor.some((v) => v.taxId === body.taxId)) throw E(409, 'ERR-VND-001', 'เลขผู้เสียภาษีซ้ำ');
  const id = nextId('vendor'); // V-13 step 4
  const v = { id, code: 'V' + String(id).padStart(4, '0'), nameTh: body.nameTh, taxId: body.taxId, email: body.email ?? null, status: 'ACTIVE' };
  S.vendor.push(v); audit(u, 'VENDOR', v.id, 'CREATE');
  return [201, vendorOut(v)];
}, { idem: true });
route('PUT', '/vendors/{vendorId}/status', ['PROCUREMENT_HEAD'], (u, { p, body }) => {
  const v = S.vendor.find((x) => x.id === p.vendorId);
  if (!v) throw E(404, 'ERR-NF-001', 'ไม่พบผู้ขาย');
  if (!['ACTIVE', 'SUSPENDED'].includes(body.status)) throw val('status', 'enum');
  if (body.status === 'SUSPENDED' && !body.reason) throw val('reason', 'required');   // V-13 step 5
  v.status = body.status; audit(u, 'VENDOR', v.id, 'STATUS', body.reason || '');
  return [200, vendorOut(v)];
});

route('GET', '/reports/spend-summary', ['PROCUREMENT_HEAD', 'ADMIN'], (u, { query }) => {
  const { from, to } = query; const by = query.groupBy || 'department';        // V-14 step 3
  if (!from || !to) throw val('from', 'required'); if (from > to) throw val('from', 'from <= to');
  const rows = new Map();
  for (const pr of S.pr) {
    const d = bkkDay(pr.createdAt);
    if (d < from || d > to || ['DRAFT', 'CANCELLED'].includes(pr.status)) continue;
    const pos = S.po.filter((x) => x.prId === pr.id && !['DRAFT', 'CANCELLED'].includes(x.status));
    if (!pos.length) continue;
    const keyOf = (po) => (by === 'vendor' ? S.vendor.find((v) => v.id === po.vendorId).nameTh : by === 'month' ? bkkMonth(pr.createdAt) : DEPTS[pr.deptId]);
    const seen = new Set();
    for (const po of pos) {
      const k = keyOf(po); const r = rows.get(k) || { group: k, prs: new Set(), poCount: 0, estimatedTotal: 0, orderedTotal: 0 };
      r.poCount += 1; r.orderedTotal = money(r.orderedTotal + po.total);
      if (!r.prs.has(pr.id)) { r.prs.add(pr.id); r.estimatedTotal = money(r.estimatedTotal + pr.total); }
      rows.set(k, r);
    }
  }
  return [200, { from, to, rows: [...rows.values()].sort((a, b) => a.group.localeCompare(b.group)).map((r) => ({ group: r.group, prCount: r.prs.size, poCount: r.poCount, estimatedTotal: r.estimatedTotal, orderedTotal: r.orderedTotal, savingVsEstimate: money(r.estimatedTotal - r.orderedTotal) })) }];
});
route('GET', '/audit-logs', ['ADMIN'], (u, { query }) => {
  if (!query.entity || !query.entityId) throw val('entity', 'required');
  return [200, S.audit.filter((a) => a.entity === query.entity && String(a.entityId) === query.entityId).map(({ entity, entityId, ...r }) => r)];
});

// test profile hooks (CNV-10)
route('POST', '/__test/reset', ['ADMIN'], () => { resetAll(); return [200, { ok: true }]; });
route('POST', '/__test/flush-idempotency', ['ADMIN'], () => { S.idem.clear(); return [200, { ok: true }]; });

// ---- dispatcher -----------------------------------------------------------------
export function createServer() {
  return http.createServer(async (req, res) => {
    const send = (status, body) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)); };
    try {
      const url = new URL(req.url, 'http://x'); const path = url.pathname.replace(/^\/api\/v1/, '');
      let hit, params = {};
      for (const r of routes) { if (r.method !== req.method) continue; const m = r.re.exec(path); if (m) { hit = r; r.keys.forEach((k, i) => (params[k] = Number(m[i + 1]))); break; } }
      if (!hit) return send(404, { code: 'ERR-NF-001', message: 'ไม่พบ' });
      clock = req.headers['x-test-now'] || null;
      const u = authenticate(req, hit.roles);
      const chunks = []; for await (const c of req) chunks.push(c);
      const raw = Buffer.concat(chunks).toString(); const body = raw ? JSON.parse(raw) : {};
      const query = Object.fromEntries(url.searchParams);
      let key, hash;
      if (hit.idem) {
        key = req.headers['idempotency-key'];
        if (!key) throw val('Idempotency-Key', 'required');                // CNV-05
        hash = crypto.createHash('sha256').update(req.method + path + raw).digest('hex');
        const seen = S.idem.get(`${u.id}|${key}`);
        if (seen) { if (seen.hash !== hash) throw E(422, 'ERR-IDEM-001', 'payload ต่างจากเดิม'); return send(seen.status, seen.body); }
      }
      const [status, out] = hit.fn(u, { p: params, body, query, req });
      if (hit.idem) S.idem.set(`${u.id}|${key}`, { hash, status, body: out });
      send(status, out);
    } catch (e) {
      if (e instanceof Err) return send(e.status, { code: e.code, message: e.message, ...(e.details ? { details: e.details } : {}) });
      console.error(e); send(500, { code: 'ERR-INTERNAL', message: String(e) });
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) createServer().listen(Number(process.env.PORT || 3100), () => console.log('listening'));
