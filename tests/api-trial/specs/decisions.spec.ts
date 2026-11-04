import { test, expect } from '@playwright/test';
import { client } from './helpers';

// Rules that the design documents state in runtime views and conventions but no AC covers.
// Found while building the reference implementation; each title names the document that owns the rule.

test('V-04 step 5: step 2 cannot be decided before step 1 -> 409 ERR-STATE-001', async ({ request }) => {
  const a = client(request);
  const pr = await a.createPr('reqA', 50000);
  const sub = await a.ok('reqA', 'POST', `/purchase-requests/${pr.prId}/submit`);
  const r = await a.call('head', 'POST', `/approvals/${sub.approvals[1].approvalId}/decision`, { decision: 'APPROVED' });
  expect([r.status, r.body.code]).toEqual([409, 'ERR-STATE-001']);
});

test('V-04 step 1: approver of another department cannot see or decide the approval -> 404', async ({ request }) => {
  const a = client(request);
  const pr = await a.createPr('reqA', 100);
  const sub = await a.ok('reqA', 'POST', `/purchase-requests/${pr.prId}/submit`);
  const r = await a.call('apprB', 'POST', `/approvals/${sub.approvals[0].approvalId}/decision`, { decision: 'APPROVED' });
  expect([r.status, r.body.code]).toEqual([404, 'ERR-NF-001']);
  expect((await a.ok('apprB', 'GET', '/approvals')).map((x: any) => x.docId)).not.toContain(pr.prId);
});

test('V-04 step 7: reject clears the chain; resubmit builds a fresh one', async ({ request }) => {
  const a = client(request);
  const pr = await a.createPr('reqA', 50000);
  const s1 = await a.ok('reqA', 'POST', `/purchase-requests/${pr.prId}/submit`);
  await a.ok('apprA', 'POST', `/approvals/${s1.approvals[0].approvalId}/decision`, { decision: 'REJECTED', comment: 'ขอแก้สเปก' });
  const back = await a.getPr('reqA', pr.prId);
  expect([back.status, back.approvals]).toEqual(['DRAFT', []]);
  const s2 = await a.ok('reqA', 'POST', `/purchase-requests/${pr.prId}/submit`);
  expect(s2.approvals.map((x: any) => [x.stepNo, x.decision])).toEqual([[1, 'PENDING'], [2, 'PENDING']]);
  const log = await a.audit('PR', pr.prId);
  expect(log.map((x: any) => x.action)).toEqual(expect.arrayContaining(['REJECT']));
  expect(log.find((x: any) => x.action === 'REJECT').detail).toBe('ขอแก้สเปก');
});

test('V-10: rejected award returns RFQ to OPEN and can be proposed again', async ({ request }) => {
  const a = client(request);
  const { pr, vs, rfq } = await a.rfq(30000);
  const q = [];
  for (const [i, p] of [100, 90, 95].entries()) q.push((await a.quote(rfq.rfqId, vs[i].vendorId, pr.items[0].prItemId, p)).body);
  await a.ok('proc', 'POST', `/rfqs/${rfq.rfqId}/award`, { quotationId: q[1].quotationId });
  const ap = (await a.ok('head', 'GET', '/approvals')).find((x: any) => x.docType === 'AWARD' && x.docId === rfq.rfqId);
  await a.ok('head', 'POST', `/approvals/${ap.approvalId}/decision`, { decision: 'REJECTED', comment: 'ขอเหตุผลเพิ่ม' });
  expect((await a.ok('proc', 'GET', `/rfqs/${rfq.rfqId}`)).status).toBe('OPEN');
  const again = await a.call('proc', 'POST', `/rfqs/${rfq.rfqId}/award`, { quotationId: q[1].quotationId });
  expect(again.status).toBe(202);
});

test('V-10 step 3: award on an RFQ that is not OPEN -> 409 ERR-STATE-001', async ({ request }) => {
  const a = client(request);
  const { pr, vs, rfq } = await a.rfq(30000);
  const q = [];
  for (const [i, p] of [100, 90, 95].entries()) q.push((await a.quote(rfq.rfqId, vs[i].vendorId, pr.items[0].prItemId, p)).body);
  await a.ok('proc', 'POST', `/rfqs/${rfq.rfqId}/award`, { quotationId: q[1].quotationId });
  const r = await a.call('proc', 'POST', `/rfqs/${rfq.rfqId}/award`, { quotationId: q[1].quotationId });
  expect([r.status, r.body.code]).toEqual([409, 'ERR-STATE-001']);
});

test('V-11 mode 2: PO from an AWARDED RFQ uses the winner and quotation prices', async ({ request }) => {
  const a = client(request);
  const { pr, vs, rfq } = await a.rfq(30000);
  const q = [];
  for (const [i, p] of [30000, 28000, 29000].entries()) q.push((await a.quote(rfq.rfqId, vs[i].vendorId, pr.items[0].prItemId, p)).body);
  await a.ok('proc', 'POST', `/rfqs/${rfq.rfqId}/award`, { quotationId: q[1].quotationId });
  const ap = (await a.ok('head', 'GET', '/approvals')).find((x: any) => x.docType === 'AWARD' && x.docId === rfq.rfqId);
  await a.ok('head', 'POST', `/approvals/${ap.approvalId}/decision`, { decision: 'APPROVED' });
  const po = await a.call('proc', 'POST', '/purchase-orders', { prId: pr.prId, rfqId: rfq.rfqId });
  expect(po.status).toBe(201);
  expect([po.body.vendorId, po.body.totalAmount, po.body.rfqId]).toEqual([vs[1].vendorId, 28000, rfq.rfqId]);
});

test('V-11 step 2: PO from an RFQ that is not AWARDED -> 409 ERR-STATE-001', async ({ request }) => {
  const a = client(request);
  const { pr, rfq } = await a.rfq(30000);
  const r = await a.call('proc', 'POST', '/purchase-orders', { prId: pr.prId, rfqId: rfq.rfqId });
  expect([r.status, r.body.code]).toEqual([409, 'ERR-STATE-001']);
});

test('V-11 step 7: issue a PO whose vendor was suspended meanwhile -> 422 ERR-VND-002', async ({ request }) => {
  const a = client(request);
  const pr = await a.approvedPr(3000), v = await a.newVendor();
  const po = await a.ok('proc', 'POST', '/purchase-orders', { prId: pr.prId, vendorId: v.vendorId });
  await a.ok('head', 'PUT', `/vendors/${v.vendorId}/status`, { status: 'SUSPENDED', reason: 'ตรวจเอกสาร' });
  const r = await a.call('proc', 'POST', `/purchase-orders/${po.poId}/issue`);
  expect([r.status, r.body.code]).toEqual([422, 'ERR-VND-002']);
});

test('V-09 step 1 / V-11 step 1: unknown prId -> 422 ERR-VAL-001 at prId', async ({ request }) => {
  const a = client(request);
  const vs = await a.vendors(3);
  const rfq = await a.call('proc', 'POST', '/rfqs', { prId: 999999, dueAt: a.dueIn(3600e3), vendorIds: vs.map((v: any) => v.vendorId) });
  const po = await a.call('proc', 'POST', '/purchase-orders', { prId: 999999, vendorId: vs[0].vendorId });
  for (const r of [rfq, po]) { expect([r.status, r.body.code]).toEqual([422, 'ERR-VAL-001']); expect(r.body.details[0].field).toBe('prId'); }
});

test('V-13 step 5: SUSPENDED without reason -> 422 ERR-VAL-001', async ({ request }) => {
  const a = client(request);
  const v = await a.newVendor();
  const r = await a.call('head', 'PUT', `/vendors/${v.vendorId}/status`, { status: 'SUSPENDED' });
  expect([r.status, r.body.code]).toEqual([422, 'ERR-VAL-001']);
});

test('CNV-05: missing Idempotency-Key -> 422 ERR-VAL-001; different payload with same key -> 422 ERR-IDEM-001', async ({ request }) => {
  const a = client(request);
  const noKey = await a.call('reqA', 'POST', '/purchase-requests', a.prInput(100), { 'idempotency-key': '' });
  expect([noKey.status, noKey.body.code]).toEqual([422, 'ERR-VAL-001']);
  const key = crypto.randomUUID();
  expect((await a.call('reqA', 'POST', '/purchase-requests', a.prInput(100), { 'idempotency-key': key })).status).toBe(201);
  const other = await a.call('reqA', 'POST', '/purchase-requests', a.prInput(200), { 'idempotency-key': key });
  expect([other.status, other.body.code]).toEqual([422, 'ERR-IDEM-001']);
});

test('CNV-06: PUT without If-Match -> 422 ERR-VAL-001', async ({ request }) => {
  const a = client(request);
  const pr = await a.createPr('reqA', 100);
  const r = await a.call('reqA', 'PUT', `/purchase-requests/${pr.prId}`, a.prInput(200));
  expect([r.status, r.body.code]).toEqual([422, 'ERR-VAL-001']);
});

test('CNV-02: "20 characters" counts Unicode code points, Thai vowels and tone marks included', async ({ request }) => {
  const a = client(request);
  const { pr, vs, rfq } = await a.rfq(30000);
  const q = [];
  for (const [i, p] of [100, 90, 95].entries()) q.push((await a.quote(rfq.rfqId, vs[i].vendorId, pr.items[0].prItemId, p)).body);
  const nineteen = 'กิ'.repeat(9) + 'ก';          // 19 code points, only 10 grapheme clusters
  expect([...nineteen]).toHaveLength(19);
  const short = await a.call('proc', 'POST', `/rfqs/${rfq.rfqId}/award`, { quotationId: q[2].quotationId, reason: nineteen });
  expect([short.status, short.body.code]).toEqual([422, 'ERR-RFQ-004']);
  const ok = await a.call('proc', 'POST', `/rfqs/${rfq.rfqId}/award`, { quotationId: q[2].quotationId, reason: nineteen + 'ก' });
  expect(ok.status).toBe(202);
});

test('CNV-02: report days are Asia/Bangkok calendar days (01:00 Bangkok on 2 Mar is 18:00 UTC on 1 Mar)', async ({ request }) => {
  const a = client(request);
  await a.reset();
  const at = '2026-03-01T18:00:00Z';
  const pr = await a.ok('reqA', 'POST', '/purchase-requests', a.prInput(1000, 1, { neededByDate: '2026-04-01' }), { 'x-test-now': at });
  await a.ok('reqA', 'POST', `/purchase-requests/${pr.prId}/submit`, undefined, { 'x-test-now': at });
  const sub = await a.getPr('reqA', pr.prId);
  await a.ok('apprA', 'POST', `/approvals/${sub.approvals[0].approvalId}/decision`, { decision: 'APPROVED' }, { 'x-test-now': at });
  const v = await a.newVendor();
  const po = await a.ok('proc', 'POST', '/purchase-orders', { prId: pr.prId, vendorId: v.vendorId }, { 'x-test-now': at });
  await a.ok('proc', 'POST', `/purchase-orders/${po.poId}/issue`, undefined, { 'x-test-now': at });
  const day = async (d: string) => (await a.ok('head', 'GET', `/reports/spend-summary?from=${d}&to=${d}`)).rows;
  expect(await day('2026-03-01')).toEqual([]);
  expect((await day('2026-03-02'))[0]).toMatchObject({ group: 'ไอที', prCount: 1, orderedTotal: 1000 });
});

test('V-06 step 4: writing to someone else\'s PR is also 404 (not 403)', async ({ request }) => {
  const a = client(request);
  const pr = await a.createPr('reqA', 100);
  const r = await a.call('reqB', 'POST', `/purchase-requests/${pr.prId}/submit`);
  expect([r.status, r.body.code]).toEqual([404, 'ERR-NF-001']);
});

test('CNV-02: a unit price with 3 decimals is rejected, not rounded', async ({ request }) => {
  const a = client(request);
  const body = a.prInput(100); body.items[0].estUnitPrice = 10.005;
  const r = await a.call('reqA', 'POST', '/purchase-requests', body);
  expect([r.status, r.body.code]).toEqual([422, 'ERR-VAL-001']);
  expect(r.body.details.map((d: any) => d.field)).toContain('items[0].estUnitPrice');
});
