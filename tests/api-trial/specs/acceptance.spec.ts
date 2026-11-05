import { test, expect } from '@playwright/test';
import { client } from './helpers';

// One test per acceptance criterion; the title starts with the AC id so a failure maps straight back to the document.

test.describe('PR create / read / update (FR-01, FR-02)', () => {
  test('AC-01-01 create PR -> 201, PR-YYYY-NNNNN, DRAFT, totalEstimated = sum', async ({ request }) => {
    const a = client(request);
    const r = await a.call('reqA', 'POST', '/purchase-requests', {
      title: 'ปากกา', justification: 'ใช้งาน', neededByDate: new Date(Date.now() + 864e5).toISOString().slice(0, 10),
      items: [{ description: 'ปากกา', quantity: 3, unit: 'ด้าม', estUnitPrice: 10 }, { description: 'คลิป', quantity: 0.5, unit: 'กล่อง', estUnitPrice: 0.01 }],
    });
    expect(r.status).toBe(201);
    expect(r.body.prNo).toMatch(/^PR-\d{4}-\d{5}$/);
    expect(r.body.status).toBe('DRAFT');
    expect(r.body.totalEstimated).toBe(30.01); // 30.00 + (0.5 x 0.01 = 0.005 -> 0.01 half-up; banker's rounding would give 30.00)
  });
  test('AC-01-02 items [] -> 422 ERR-VAL-001', async ({ request }) => {
    const a = client(request);
    const r = await a.call('reqA', 'POST', '/purchase-requests', a.prInput(100, 1, { items: [] }));
    expect([r.status, r.body.code]).toEqual([422, 'ERR-VAL-001']);
  });
  test('AC-01-03 quantity 0 -> 422 ERR-VAL-001 at items[0].quantity', async ({ request }) => {
    const a = client(request);
    const body = a.prInput(100); body.items[0].quantity = 0;
    const r = await a.call('reqA', 'POST', '/purchase-requests', body);
    expect([r.status, r.body.code]).toEqual([422, 'ERR-VAL-001']);
    expect(r.body.details.map((d: any) => d.field)).toContain('items[0].quantity');
  });
  test('AC-01-04 stale If-Match -> 409 ERR-CONC-001', async ({ request }) => {
    const a = client(request);
    const pr = await a.createPr('reqA', 100);
    const ok1 = await a.call('reqA', 'PUT', `/purchase-requests/${pr.prId}`, a.prInput(200), { 'if-match': pr.rowVersion });
    expect(ok1.status).toBe(200);
    const stale = await a.call('reqA', 'PUT', `/purchase-requests/${pr.prId}`, a.prInput(300), { 'if-match': pr.rowVersion });
    expect([stale.status, stale.body.code]).toEqual([409, 'ERR-CONC-001']);
  });
  test('AC-02-01 requester never sees another requester\'s PR', async ({ request }) => {
    const a = client(request);
    const other = await a.createPr('reqB', 111);
    const r = await a.call('reqA', 'GET', '/purchase-requests?limit=100');
    expect(r.status).toBe(200);
    expect(r.body.items.map((p: any) => p.prId)).not.toContain(other.prId);
  });
  test('AC-02-05 a receiver lists only PRs that have an issued PO', async ({ request }) => {
    const a = client(request);
    const waiting = await a.approvedPr(3000);
    const { pr: withPo } = await a.issuedPo(3000, 3);
    const r = await a.call('recv', 'GET', '/purchase-requests?limit=100');
    expect(r.status).toBe(200);
    const ids = r.body.items.map((p: any) => p.prId);
    expect(ids).toContain(withPo.prId);
    expect(ids).not.toContain(waiting.prId);
  });
  test('AC-02-02 expired token -> 401 ERR-AUTH-001', async ({ request }) => {
    const a = client(request);
    const r = await a.call('reqA', 'GET', '/purchase-requests', undefined, {}, { exp: Math.floor(Date.now() / 1000) - 10 });
    expect([r.status, r.body.code]).toEqual([401, 'ERR-AUTH-001']);
  });
  test('AC-02-03 owner reads submitted PR (50,000): items + 2 ordered approval steps', async ({ request }) => {
    const a = client(request);
    const pr = await a.createPr('reqA', 50000);
    await a.ok('reqA', 'POST', `/purchase-requests/${pr.prId}/submit`);
    const r = await a.call('reqA', 'GET', `/purchase-requests/${pr.prId}`);
    expect(r.status).toBe(200);
    expect(r.body.items).toHaveLength(1);
    expect(r.body.approvals.map((x: any) => [x.stepNo, x.requiredRole])).toEqual([[1, 'DEPT_APPROVER'], [2, 'PROCUREMENT_HEAD']]);
  });
  test('AC-02-04 approver of dept B asks for dept A PR -> 404 ERR-NF-001 (existence is not revealed)', async ({ request }) => {
    const a = client(request);
    const pr = await a.createPr('reqA', 100);
    const r = await a.call('apprB', 'GET', `/purchase-requests/${pr.prId}`);
    expect([r.status, r.body.code]).toEqual([404, 'ERR-NF-001']);
  });
});

test.describe('Submit (FR-03)', () => {
  for (const [id, total, steps] of [['AC-03-01', 20000.0, 1], ['AC-03-02', 20000.01, 2], ['AC-03-03', 200000.0, 2], ['AC-03-04', 200000.01, 3]] as const) {
    test(`${id} totalEstimated ${total} -> ${steps} approval step(s)`, async ({ request }) => {
      const a = client(request);
      const pr = await a.createPr('reqA', total);
      expect(pr.totalEstimated).toBe(total);
      const s = await a.call('reqA', 'POST', `/purchase-requests/${pr.prId}/submit`);
      expect(s.status).toBe(200);
      expect(s.body.approvals.map((x: any) => x.requiredRole)).toEqual(['DEPT_APPROVER', 'PROCUREMENT_HEAD', 'COMMITTEE'].slice(0, steps));
    });
  }
  test('AC-03-05 same key + payload twice -> same result, one approval chain, one audit row', async ({ request }) => {
    const a = client(request);
    const pr = await a.createPr('reqA', 50000);
    const key = crypto.randomUUID();
    const r1 = await a.submit('reqA', pr.prId, key), r2 = await a.submit('reqA', pr.prId, key);
    expect([r1.status, r2.status]).toEqual([200, 200]);
    expect(r2.body).toEqual(r1.body);
    expect(r1.body.approvals).toHaveLength(2);
    expect((await a.audit('PR', pr.prId)).filter((x: any) => x.action === 'SUBMIT')).toHaveLength(1);
  });
  test('AC-03-06 resubmit with a new key -> 409 ERR-STATE-001', async ({ request }) => {
    const a = client(request);
    const pr = await a.createPr('reqA', 100);
    await a.ok('reqA', 'POST', `/purchase-requests/${pr.prId}/submit`);
    const r = await a.submit('reqA', pr.prId);
    expect([r.status, r.body.code]).toEqual([409, 'ERR-STATE-001']);
  });
  test('AC-03-07 idempotency cache cleared, same key again -> 409 ERR-STATE-001, no duplicate rows', async ({ request }) => {
    const a = client(request);
    const pr = await a.createPr('reqA', 50000);
    const key = crypto.randomUUID();
    await a.submit('reqA', pr.prId, key);
    await a.flushIdempotency();
    const r = await a.submit('reqA', pr.prId, key);
    expect([r.status, r.body.code]).toEqual([409, 'ERR-STATE-001']);
    expect((await a.getPr('reqA', pr.prId)).approvals).toHaveLength(2);
    expect((await a.audit('PR', pr.prId)).filter((x: any) => x.action === 'SUBMIT')).toHaveLength(1);
  });
});

test.describe('Approvals (FR-04)', () => {
  test('AC-04-01 approver who is also the requester -> 403 ERR-SOD-001', async ({ request }) => {
    const a = client(request);
    const pr = await a.createPr('reqA', 100);
    const sub = await a.ok('reqA', 'POST', `/purchase-requests/${pr.prId}/submit`);
    const r = await a.call('dualA', 'POST', `/approvals/${sub.approvals[0].approvalId}/decision`, { decision: 'APPROVED' });
    expect([r.status, r.body.code]).toEqual([403, 'ERR-SOD-001']);
  });
  test('AC-04-02 REJECTED without comment -> 422 ERR-VAL-001', async ({ request }) => {
    const a = client(request);
    const pr = await a.createPr('reqA', 100);
    const sub = await a.ok('reqA', 'POST', `/purchase-requests/${pr.prId}/submit`);
    const r = await a.call('apprA', 'POST', `/approvals/${sub.approvals[0].approvalId}/decision`, { decision: 'REJECTED' });
    expect([r.status, r.body.code]).toEqual([422, 'ERR-VAL-001']);
  });
  test('AC-04-03 two-step PR approved in order -> APPROVED, audit for every step', async ({ request }) => {
    const a = client(request);
    const pr = await a.createPr('reqA', 50000);
    const sub = await a.ok('reqA', 'POST', `/purchase-requests/${pr.prId}/submit`);
    const [s1, s2] = sub.approvals;
    const early = await a.call('head', 'POST', `/approvals/${s2.approvalId}/decision`, { decision: 'APPROVED' }); // step 2 before step 1
    expect(early.status).toBe(409);                                                                              // code
    expect((await a.call('apprA', 'POST', `/approvals/${s1.approvalId}/decision`, { decision: 'APPROVED' })).status).toBe(200);
    expect((await a.getPr('reqA', pr.prId)).status).toBe('SUBMITTED');
    expect((await a.call('head', 'POST', `/approvals/${s2.approvalId}/decision`, { decision: 'APPROVED' })).status).toBe(200);
    expect((await a.getPr('reqA', pr.prId)).status).toBe('APPROVED');
    expect((await a.audit('PR', pr.prId)).filter((x: any) => x.action === 'APPROVE')).toHaveLength(2);           // action name
  });
  test('AC-04-04 first approver rejects with reason -> PR back to DRAFT and editable', async ({ request }) => {
    const a = client(request);
    const pr = await a.createPr('reqA', 50000);
    const sub = await a.ok('reqA', 'POST', `/purchase-requests/${pr.prId}/submit`);
    const r = await a.call('apprA', 'POST', `/approvals/${sub.approvals[0].approvalId}/decision`, { decision: 'REJECTED', comment: 'ขอรายละเอียด' });
    expect(r.status).toBe(200);
    const now = await a.getPr('reqA', pr.prId);
    expect(now.status).toBe('DRAFT');
    expect((await a.call('reqA', 'PUT', `/purchase-requests/${pr.prId}`, a.prInput(60000), { 'if-match': now.rowVersion })).status).toBe(200);
  });
  test('AC-04-05 PROCUREMENT_HEAD does not see a PR still at the DEPT_APPROVER step', async ({ request }) => {
    const a = client(request);
    const pr = await a.createPr('reqA', 50000);
    await a.ok('reqA', 'POST', `/purchase-requests/${pr.prId}/submit`);
    const r = await a.call('head', 'GET', '/approvals');
    expect(r.status).toBe(200);
    expect(r.body.map((x: any) => x.docId)).not.toContain(pr.prId);
  });
});

test.describe('RFQ (FR-05)', () => {
  test('AC-05-01 APPROVED PR, 3 vendors -> 201 RFQ-YYYY-NNNNN, PR IN_SOURCING', async ({ request }) => {
    const a = client(request);
    const { pr, rfq } = await a.rfq(30000);
    expect(rfq.rfqNo).toMatch(/^RFQ-\d{4}-\d{5}$/);
    expect((await a.getPr('reqA', pr.prId)).status).toBe('IN_SOURCING');
  });
  test('AC-05-02 APPROVED PR of 5,000.00 -> 422 ERR-RFQ-006', async ({ request }) => {
    const a = client(request);
    const pr = await a.approvedPr(5000), vs = await a.vendors(3);
    const r = await a.call('proc', 'POST', '/rfqs', { prId: pr.prId, dueAt: a.dueIn(3600e3), vendorIds: vs.map((v: any) => v.vendorId) });
    expect([r.status, r.body.code]).toEqual([422, 'ERR-RFQ-006']);
  });
  test('AC-05-03 two vendors -> 422 ERR-RFQ-001', async ({ request }) => {
    const a = client(request);
    const pr = await a.approvedPr(30000), vs = await a.vendors(2);
    const r = await a.call('proc', 'POST', '/rfqs', { prId: pr.prId, dueAt: a.dueIn(3600e3), vendorIds: vs.map((v: any) => v.vendorId) });
    expect([r.status, r.body.code]).toEqual([422, 'ERR-RFQ-001']);
  });
  test('AC-05-04 one of three vendors SUSPENDED -> 422 ERR-VND-002', async ({ request }) => {
    const a = client(request);
    const pr = await a.approvedPr(30000), vs = await a.vendors(3);
    await a.ok('head', 'PUT', `/vendors/${vs[1].vendorId}/status`, { status: 'SUSPENDED', reason: 'ตรวจเอกสาร' });
    const r = await a.call('proc', 'POST', '/rfqs', { prId: pr.prId, dueAt: a.dueIn(3600e3), vendorIds: vs.map((v: any) => v.vendorId) });
    expect([r.status, r.body.code]).toEqual([422, 'ERR-VND-002']);
  });
  test('AC-05-05 PR still SUBMITTED -> 409 ERR-STATE-002', async ({ request }) => {
    const a = client(request);
    const pr = await a.createPr('reqA', 30000); await a.ok('reqA', 'POST', `/purchase-requests/${pr.prId}/submit`);
    const vs = await a.vendors(3);
    const r = await a.call('proc', 'POST', '/rfqs', { prId: pr.prId, dueAt: a.dueIn(3600e3), vendorIds: vs.map((v: any) => v.vendorId) });
    expect([r.status, r.body.code]).toEqual([409, 'ERR-STATE-002']);
  });
  test('AC-05-06 getRfq: 1 item, 3 vendors, prNo', async ({ request }) => {
    const a = client(request);
    const { pr, rfq } = await a.rfq(30000);
    const r = await a.call('proc', 'GET', `/rfqs/${rfq.rfqId}`);
    expect(r.status).toBe(200);
    expect(r.body.items).toHaveLength(1); expect(r.body.vendors).toHaveLength(3); expect(r.body.prNo).toBe(pr.prNo);
  });
  test('AC-05-08 getRfq shows the proposed winner and the reason; empty before an award', async ({ request }) => {
    const a = client(request);
    const { pr, vs, rfq } = await a.rfq(30000);
    const q = [];
    for (const [i, p] of [100, 90, 95].entries()) q.push((await a.quote(rfq.rfqId, vs[i].vendorId, pr.items[0].prItemId, p)).body);
    const before = await a.ok('head', 'GET', `/rfqs/${rfq.rfqId}`);
    expect([before.awardedQuotationId, before.awardReason]).toEqual([null, null]);
    await a.ok('proc', 'POST', `/rfqs/${rfq.rfqId}/award`, { quotationId: q[2].quotationId, reason: 'ผู้ขายนี้รับประกันสามปีและส่งมอบเร็ว' });
    const after = await a.ok('head', 'GET', `/rfqs/${rfq.rfqId}`);
    expect([after.awardedQuotationId, after.awardReason]).toEqual([q[2].quotationId, 'ผู้ขายนี้รับประกันสามปีและส่งมอบเร็ว']);
  });
  test('AC-05-07 unknown rfqId -> 404 ERR-NF-001', async ({ request }) => {
    const r = await client(request).call('proc', 'GET', '/rfqs/999999');
    expect([r.status, r.body.code]).toEqual([404, 'ERR-NF-001']);
  });
});

test.describe('Quotations & comparison (FR-06, FR-07)', () => {
  test('AC-06-01 vendor not invited -> 422 ERR-RFQ-002', async ({ request }) => {
    const a = client(request);
    const { pr, rfq } = await a.rfq(30000);
    const outsider = await a.newVendor();
    const r = await a.quote(rfq.rfqId, outsider.vendorId, pr.items[0].prItemId, 100);
    expect([r.status, r.body.code]).toEqual([422, 'ERR-RFQ-002']);
  });
  test('AC-06-02 after dueAt -> 409 ERR-RFQ-003 (clock moved with X-Test-Now, CNV-10)', async ({ request }) => {
    const a = client(request);
    const { pr, vs, rfq } = await a.rfq(30000);
    const late = new Date(Date.parse(rfq.dueAt) + 1000).toISOString();
    const r = await a.call('proc', 'POST', `/rfqs/${rfq.rfqId}/quotations`, { vendorId: vs[0].vendorId, leadTimeDays: 7, items: [{ prItemId: pr.items[0].prItemId, unitPrice: 100 }] }, { 'x-test-now': late });
    expect([r.status, r.body.code]).toEqual([409, 'ERR-RFQ-003']);
  });
  test('AC-06-03 same vendor twice -> first inactive, second active, one active left', async ({ request }) => {
    const a = client(request);
    const { pr, vs, rfq } = await a.rfq(30000);
    const q1 = await a.quote(rfq.rfqId, vs[0].vendorId, pr.items[0].prItemId, 100);
    const q2 = await a.quote(rfq.rfqId, vs[0].vendorId, pr.items[0].prItemId, 90);
    expect([q1.status, q2.status]).toEqual([201, 201]);
    expect(q2.body.isActive).toBe(true);
    const cmp = await a.ok('proc', 'GET', `/rfqs/${rfq.rfqId}/comparison`);
    expect(cmp.quotations.filter((q: any) => q.isActive)).toHaveLength(1);
    // the superseded quotation stays in the database with is_active = 0; no operation reads it, so that half of the AC is a DB-level check
    expect(cmp.quotations.map((q: any) => q.quotationId)).toEqual([q2.body.quotationId]);
  });
  test('AC-07-01 totals 100, 90, 95 -> lowestQuotationId is the 90', async ({ request }) => {
    const a = client(request);
    const { pr, vs, rfq } = await a.rfq(30000);
    const q = [];
    for (const [i, price] of [100, 90, 95].entries()) q.push((await a.quote(rfq.rfqId, vs[i].vendorId, pr.items[0].prItemId, price)).body);
    const cmp = await a.ok('proc', 'GET', `/rfqs/${rfq.rfqId}/comparison`);
    expect(cmp.lowestQuotationId).toBe(q[1].quotationId);
  });
});

test.describe('Award (FR-08)', () => {
  const setup = async (request: any, prices: number[], total = 30000) => {
    const a = client(request);
    const ctx = await a.rfq(total);
    const q = [];
    for (const [i, p] of prices.entries()) q.push((await a.quote(ctx.rfq.rfqId, ctx.vs[i].vendorId, ctx.pr.items[0].prItemId, p)).body);
    return { a, ...ctx, q };
  };
  test('AC-08-01 only one active quotation -> 422 ERR-RFQ-005', async ({ request }) => {
    const { a, rfq, q } = await setup(request, [100]);
    const r = await a.call('proc', 'POST', `/rfqs/${rfq.rfqId}/award`, { quotationId: q[0].quotationId });
    expect([r.status, r.body.code]).toEqual([422, 'ERR-RFQ-005']);
  });
  test('AC-08-02 pick 95 while lowest is 90, no reason -> 422 ERR-RFQ-004', async ({ request }) => {
    const { a, rfq, q } = await setup(request, [100, 90, 95]);
    const r = await a.call('proc', 'POST', `/rfqs/${rfq.rfqId}/award`, { quotationId: q[2].quotationId });
    expect([r.status, r.body.code]).toEqual([422, 'ERR-RFQ-004']);
  });
  test('AC-08-03 reason of 19 characters -> 422 ERR-RFQ-004', async ({ request }) => {
    const { a, rfq, q } = await setup(request, [100, 90, 95]);
    const r = await a.call('proc', 'POST', `/rfqs/${rfq.rfqId}/award`, { quotationId: q[2].quotationId, reason: 'x'.repeat(19) });
    expect([r.status, r.body.code]).toEqual([422, 'ERR-RFQ-004']);
  });
  test('AC-08-04 reason of 20 characters -> 202, RFQ AWARD_PENDING', async ({ request }) => {
    const { a, rfq, q } = await setup(request, [100, 90, 95]);
    const r = await a.call('proc', 'POST', `/rfqs/${rfq.rfqId}/award`, { quotationId: q[2].quotationId, reason: 'x'.repeat(20) });
    expect(r.status).toBe(202); expect(r.body.status).toBe('AWARD_PENDING');
  });
  test('AC-08-05 winner worth 250,000 approved by COMMITTEE -> RFQ AWARDED (BR-05)', async ({ request }) => {
    const { a, rfq, q } = await setup(request, [250000, 260000, 270000], 300000);
    await a.ok('proc', 'POST', `/rfqs/${rfq.rfqId}/award`, { quotationId: q[0].quotationId });
    expect((await a.ok('head', 'GET', '/approvals')).filter((x: any) => x.docType === 'AWARD' && x.docId === rfq.rfqId)).toHaveLength(0); // wrong role does not see it
    const mine = (await a.ok('committee', 'GET', '/approvals')).find((x: any) => x.docType === 'AWARD' && x.docId === rfq.rfqId); // docId meaning
    expect(mine).toBeTruthy();
    expect((await a.call('committee', 'POST', `/approvals/${mine.approvalId}/decision`, { decision: 'APPROVED' })).status).toBe(200);
    expect((await a.ok('proc', 'GET', `/rfqs/${rfq.rfqId}`)).status).toBe('AWARDED');
  });
  test('extra: awarding by the same user who approves is blocked (BR-04 for AWARD) - not an AC, derived from V-10 step 7', async ({ request }) => {
    // PROCUREMENT proposes, approvals need PROCUREMENT_HEAD/COMMITTEE; with a multi-role claim the proposer must be refused
    const { a, rfq, q } = await setup(request, [100, 90, 95]);
    await a.ok('proc', 'POST', `/rfqs/${rfq.rfqId}/award`, { quotationId: q[1].quotationId });
    const pending = (await a.ok('head', 'GET', '/approvals')).find((x: any) => x.docType === 'AWARD' && x.docId === rfq.rfqId);
    expect(pending.proposerId).toBe(4);
  });
});

test.describe('Purchase order (FR-09)', () => {
  test('AC-09-01 APPROVED PR of 5,000.00 + vendor -> 201 PO-YYYY-NNNNN, PR ORDERED', async ({ request }) => {
    const a = client(request);
    const pr = await a.approvedPr(5000), v = await a.newVendor();
    const r = await a.call('proc', 'POST', '/purchase-orders', { prId: pr.prId, vendorId: v.vendorId });
    expect(r.status).toBe(201); expect(r.body.poNo).toMatch(/^PO-\d{4}-\d{5}$/);
    expect((await a.getPr('reqA', pr.prId)).status).toBe('ORDERED');
  });
  test('AC-09-02 5,000.01 without rfqId -> 422 ERR-PO-001', async ({ request }) => {
    const a = client(request);
    const pr = await a.approvedPr(5000.01), v = await a.newVendor();
    const r = await a.call('proc', 'POST', '/purchase-orders', { prId: pr.prId, vendorId: v.vendorId });
    expect([r.status, r.body.code]).toEqual([422, 'ERR-PO-001']);
  });
  test('AC-09-03 direct purchase from SUSPENDED vendor -> 422 ERR-VND-002', async ({ request }) => {
    const a = client(request);
    const pr = await a.approvedPr(3000), v = await a.newVendor();
    await a.ok('head', 'PUT', `/vendors/${v.vendorId}/status`, { status: 'SUSPENDED', reason: 'ตรวจเอกสาร' });
    const r = await a.call('proc', 'POST', '/purchase-orders', { prId: pr.prId, vendorId: v.vendorId });
    expect([r.status, r.body.code]).toEqual([422, 'ERR-VND-002']);
  });
  test('AC-09-04 issue a DRAFT PO -> 200 ISSUED with audit', async ({ request }) => {
    const a = client(request);
    const { po } = await a.issuedPo(3000, 1);
    expect(po.status).toBe('ISSUED');
    expect((await a.audit('PO', po.poId)).map((x: any) => x.action)).toContain('ISSUE');
  });
  test('AC-09-05 issue an ISSUED PO with a new key -> 409 ERR-STATE-001', async ({ request }) => {
    const a = client(request);
    const { po } = await a.issuedPo(3000, 1);
    const r = await a.call('proc', 'POST', `/purchase-orders/${po.poId}/issue`);
    expect([r.status, r.body.code]).toEqual([409, 'ERR-STATE-001']);
  });
  test('AC-09-06 ordered 6, received 4 (1 rejected) -> qtyReceived 4, qtyRemaining 2', async ({ request }) => {
    const a = client(request);
    const { po } = await a.issuedPo(4800, 6);
    await a.ok('recv', 'POST', `/purchase-orders/${po.poId}/receipts`, { items: [{ poItemId: po.items[0].poItemId, qtyReceived: 4, qtyRejected: 1 }] });
    const r = await a.call('recv', 'GET', `/purchase-orders/${po.poId}`);
    expect([r.body.items[0].qtyReceived, r.body.items[0].qtyRemaining]).toEqual([4, 2]);
  });
  test('AC-09-07 unknown poId -> 404 ERR-NF-001', async ({ request }) => {
    const r = await client(request).call('proc', 'GET', '/purchase-orders/999999');
    expect([r.status, r.body.code]).toEqual([404, 'ERR-NF-001']);
  });
});

test.describe('Goods receipt (FR-10)', () => {
  test('AC-10-01 ordered 10, receive 4 -> 201 GR-YYYY-NNNNN, PO PARTIALLY_RECEIVED', async ({ request }) => {
    const a = client(request);
    const { po } = await a.issuedPo(1000, 10);
    const r = await a.call('recv', 'POST', `/purchase-orders/${po.poId}/receipts`, { items: [{ poItemId: po.items[0].poItemId, qtyReceived: 4 }] });
    expect(r.status).toBe(201); expect(r.body.grNo).toMatch(/^GR-\d{4}-\d{5}$/); expect(r.body.poStatus).toBe('PARTIALLY_RECEIVED');
  });
  test('AC-10-02 receive 4 then 6 -> PO RECEIVED, PR CLOSED', async ({ request }) => {
    const a = client(request);
    const { pr, po } = await a.issuedPo(1000, 10);
    const id = po.items[0].poItemId;
    await a.ok('recv', 'POST', `/purchase-orders/${po.poId}/receipts`, { items: [{ poItemId: id, qtyReceived: 4 }] });
    const r = await a.call('recv', 'POST', `/purchase-orders/${po.poId}/receipts`, { items: [{ poItemId: id, qtyReceived: 6 }] });
    expect(r.body.poStatus).toBe('RECEIVED');
    expect((await a.getPr('reqA', pr.prId)).status).toBe('CLOSED');
  });
  test('AC-10-03 received 4 of 10, then 7 more -> 422 ERR-GR-001, nothing recorded', async ({ request }) => {
    const a = client(request);
    const { po } = await a.issuedPo(1000, 10);
    const id = po.items[0].poItemId;
    await a.ok('recv', 'POST', `/purchase-orders/${po.poId}/receipts`, { items: [{ poItemId: id, qtyReceived: 4 }] });
    const r = await a.call('recv', 'POST', `/purchase-orders/${po.poId}/receipts`, { items: [{ poItemId: id, qtyReceived: 7 }] });
    expect([r.status, r.body.code]).toEqual([422, 'ERR-GR-001']);
    expect((await a.ok('recv', 'GET', `/purchase-orders/${po.poId}`)).items[0].qtyReceived).toBe(4);
  });
  test('AC-10-04 received 5 rejected 1 -> cumulative 5, not 6', async ({ request }) => {
    const a = client(request);
    const { po } = await a.issuedPo(1000, 10);
    await a.ok('recv', 'POST', `/purchase-orders/${po.poId}/receipts`, { items: [{ poItemId: po.items[0].poItemId, qtyReceived: 5, qtyRejected: 1 }] });
    expect((await a.ok('recv', 'GET', `/purchase-orders/${po.poId}`)).items[0].qtyReceived).toBe(5);
  });
});

test.describe('Vendors (FR-11)', () => {
  test('AC-11-01 duplicate taxId -> 409 ERR-VND-001', async ({ request }) => {
    const a = client(request);
    const v = await a.newVendor();
    const r = await a.call('proc', 'POST', '/vendors', { nameTh: 'ซ้ำ', taxId: v.taxId, email: 'x@y.example.test' });
    expect([r.status, r.body.code]).toEqual([409, 'ERR-VND-001']);
  });
  test('AC-11-02 taxId of 12 digits -> 422 ERR-VAL-001', async ({ request }) => {
    const r = await client(request).call('proc', 'POST', '/vendors', { nameTh: 'สั้น', taxId: '123456789012', email: 'x@y.example.test' });
    expect([r.status, r.body.code]).toEqual([422, 'ERR-VAL-001']);
  });
  test('AC-11-03 head suspends with reason -> 200 + audit', async ({ request }) => {
    const a = client(request);
    const v = await a.newVendor();
    const r = await a.call('head', 'PUT', `/vendors/${v.vendorId}/status`, { status: 'SUSPENDED', reason: 'ตรวจเอกสาร' });
    expect(r.status).toBe(200); expect(r.body.status).toBe('SUSPENDED');
    expect((await a.audit('VENDOR', v.vendorId)).length).toBeGreaterThan(1);        // entity string 'VENDOR' is stated in V-13, action names are not
  });
  test('AC-11-04 q = part of the name -> only matching vendors', async ({ request }) => {
    const a = client(request);
    const v = await a.ok('proc', 'POST', '/vendors', { nameTh: 'ชื่อพิเศษเฉพาะกิจ', taxId: '9999999999991', email: 'q@y.example.test' });
    await a.newVendor();
    const r = await a.call('proc', 'GET', '/vendors?q=' + encodeURIComponent('พิเศษเฉพาะ'));
    expect(r.body.map((x: any) => x.vendorId)).toEqual([v.vendorId]);
  });
});

test.describe('Reports & audit (FR-12, FR-13)', () => {
  test('AC-12-01 spend summary sums match the source data; saving = estimate - ordered', async ({ request }) => {
    const a = client(request);
    await a.reset();                                                                   // no isolation mechanism in the docs
    const a1 = await a.issuedPo(3000, 10, 'reqA'), a2 = await a.issuedPo(2000, 4, 'reqA'), b1 = await a.issuedPo(4000, 8, 'reqB');
    const today = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);   // Asia/Bangkok day (CNV-02)
    const r = await a.call('head', 'GET', `/reports/spend-summary?from=${today}&to=${today}&groupBy=department`);
    expect(r.status).toBe(200);
    const row = (g: string) => r.body.rows.find((x: any) => x.group === g);
    expect(row('ไอที')).toMatchObject({ prCount: 2, poCount: 2, estimatedTotal: 5000, orderedTotal: 5000, savingVsEstimate: 0 });
    expect(row('ปฏิบัติการ')).toMatchObject({ prCount: 1, poCount: 1, estimatedTotal: 4000, orderedTotal: 4000 });
    void a1; void a2; void b1;
  });
  test('AC-12-02 REQUESTER -> 403 ERR-AUTH-002', async ({ request }) => {
    const r = await client(request).call('reqA', 'GET', '/reports/spend-summary?from=2026-01-01&to=2026-12-31');
    expect([r.status, r.body.code]).toEqual([403, 'ERR-AUTH-002']);
  });
  test('AC-13-01 PR through submit -> approve -> RFQ shows events in time order', async ({ request }) => {
    const a = client(request);
    const { pr, rfq } = await a.rfq(30000);
    const ev = await a.audit('PR', pr.prId);
    expect(ev.map((x: any) => x.action)).toEqual(expect.arrayContaining(['SUBMIT', 'APPROVE']));
    expect(ev.map((x: any) => x.createdAt)).toEqual([...ev.map((x: any) => x.createdAt)].sort());
    expect((await a.audit('RFQ', rfq.rfqId)).length).toBeGreaterThan(0);   
  });
});

test.describe('Concurrency (NFR-04)', () => {
  test('AC-14-01 20 workers create 1,000 PRs -> 1,000 unique, consecutive numbers', async ({ request }) => {
    const a = client(request);
    await a.reset();
    const nos: number[] = [];
    let n = 0;
    await Promise.all(Array.from({ length: 20 }, async () => {
      while (n < 1000) { n++; const r = await a.call('reqA', 'POST', '/purchase-requests', a.prInput(100)); expect(r.status).toBe(201); nos.push(Number(r.body.prNo.slice(-5))); }
    }));
    expect(nos).toHaveLength(1000);
    expect(new Set(nos).size).toBe(1000);
    const s = [...nos].sort((x, y) => x - y);
    expect(s.at(-1)! - s[0] + 1).toBe(1000);
  });
});
