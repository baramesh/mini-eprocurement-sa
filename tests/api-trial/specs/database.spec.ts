import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { client } from './helpers';

// Checks that need the real database: permissions of the application account, history rows, and behaviour under concurrency.
// They talk to the SQL Server container of reference/compose.yml (project "eproc").
const SA = process.env.SA_PASSWORD ?? 'Dev_Passw0rd!x';
const APP = process.env.APP_PASSWORD ?? 'App_Passw0rd!x';
const sql = (query: string, user = 'sa', pw = SA) => {
  try {
    return execFileSync('docker', ['exec', 'eproc-db-1', '/opt/mssql-tools18/bin/sqlcmd', '-C', '-S', 'localhost', '-U', user, '-P', pw, '-d', 'eproc', '-h', '-1', '-W', '-b', '-Q', `SET NOCOUNT ON; ${query}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (e: any) { return `ERROR: ${e.stdout ?? ''}${e.stderr ?? ''}`; }
};

test('AC-13-02 the application account cannot UPDATE or DELETE audit_log (NFR-02)', async ({ request }) => {
  const a = client(request);
  const pr = await a.createPr('reqA', 100);
  const id = (await a.audit('PR', pr.prId))[0].auditId;
  expect(sql(`UPDATE audit_log SET detail = N'x' WHERE audit_id = ${id}`, 'app', APP)).toMatch(/permission was denied/i);
  expect(sql(`DELETE FROM audit_log WHERE audit_id = ${id}`, 'app', APP)).toMatch(/permission was denied/i);
  expect(sql(`SELECT COUNT(*) FROM audit_log WHERE audit_id = ${id}`)).toBe('1');
});

test('AC-06-03 (database half) the superseded quotation stays with is_active = 0', async ({ request }) => {
  const a = client(request);
  const { pr, vs, rfq } = await a.rfq(30000);
  const q1 = await a.quote(rfq.rfqId, vs[0].vendorId, pr.items[0].prItemId, 100);
  const q2 = await a.quote(rfq.rfqId, vs[0].vendorId, pr.items[0].prItemId, 90);
  const rows = sql(`SELECT quotation_id, is_active FROM quotation WHERE rfq_id = ${rfq.rfqId} AND vendor_id = ${vs[0].vendorId} ORDER BY quotation_id`).split('\n').map((l) => l.trim().split(/\s+/));
  expect(rows).toEqual([[String(q1.body.quotationId), '0'], [String(q2.body.quotationId), '1']]);
});

test('V-12 step 3: two receipts at once that together exceed the order -> exactly one succeeds', async ({ request }) => {
  const a = client(request);
  const { po } = await a.issuedPo(1000, 10);
  const id = po.items[0].poItemId;
  const rs = await Promise.all([6, 6].map((q) => a.call('recv', 'POST', `/purchase-orders/${po.poId}/receipts`, { items: [{ poItemId: id, qtyReceived: q }] })));
  expect(rs.map((r) => r.status).sort()).toEqual([201, 422]);
  expect(rs.find((r) => r.status === 422)!.body.code).toBe('ERR-GR-001');
  expect((await a.ok('recv', 'GET', `/purchase-orders/${po.poId}`)).items[0].qtyReceived).toBe(6);
});

test('V-13 step 3: two vendors with the same taxId created at once -> one 201, one 409 ERR-VND-001', async ({ request }) => {
  const a = client(request);
  const body = { nameTh: 'พร้อมกัน', taxId: String(Date.now() % 1e13).padStart(13, '7'), email: 'x@y.example.test' };
  const rs = await Promise.all([1, 2].map(() => a.call('proc', 'POST', '/vendors', body)));
  expect(rs.map((r) => r.status).sort()).toEqual([201, 409]);
  expect(rs.find((r) => r.status === 409)!.body.code).toBe('ERR-VND-001');
});

test('V-03 step 3: the same PR submitted twice at once with different keys -> one 200, one 409, one approval chain', async ({ request }) => {
  const a = client(request);
  const pr = await a.createPr('reqA', 50000);
  const rs = await Promise.all([1, 2].map(() => a.submit('reqA', pr.prId)));
  expect(rs.map((r) => r.status).sort()).toEqual([200, 409]);
  expect(rs.find((r) => r.status === 409)!.body.code).toBe('ERR-STATE-001');
  expect((await a.getPr('reqA', pr.prId)).approvals).toHaveLength(2);
});

test('V-09 step 10: the same vendor quoting twice at once leaves exactly one active quotation', async ({ request }) => {
  const a = client(request);
  const { pr, vs, rfq } = await a.rfq(30000);
  const rs = await Promise.all([100, 90].map((p) => a.quote(rfq.rfqId, vs[0].vendorId, pr.items[0].prItemId, p)));
  expect(rs.every((r) => [201, 409].includes(r.status))).toBe(true);
  expect(sql(`SELECT COUNT(*) FROM quotation WHERE rfq_id = ${rfq.rfqId} AND vendor_id = ${vs[0].vendorId} AND is_active = 1`)).toBe('1');
});

test('CNV-02: a total beyond the column range is rejected with 422, not a database error', async ({ request }) => {
  const a = client(request);
  const huge = a.prInput(1, 1); huge.items = Array.from({ length: 100 }, () => ({ description: 'x', quantity: 999999999, unit: 'u', estUnitPrice: 999999999999 }));
  const r = await a.call('reqA', 'POST', '/purchase-requests', huge);
  expect([r.status, r.body.code]).toEqual([422, 'ERR-VAL-001']);
});
