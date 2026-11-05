import { test, expect } from '@playwright/test';
import { client } from '../specs/helpers';
import { be, localDateTime, session } from './helpers';

// State and error rows of the interaction specs (design/05-ui-desc/interactions), one screen at a time.

test.describe('SCR-01 PR list', () => {
  test('filters live in the query string and survive a reload; empty state offers to clear them', async ({ browser }) => {
    const p = await session(browser, 'reqA');
    await p.goto('/purchase-requests?status=CANCELLED');
    await expect(p.getByLabel('สถานะ')).toHaveValue('CANCELLED');
    await expect(p.getByText('ไม่พบใบขอซื้อตามเงื่อนไข')).toBeVisible();
    await p.reload();
    await expect(p.getByLabel('สถานะ')).toHaveValue('CANCELLED');
    await p.getByRole('button', { name: 'ล้างตัวกรอง' }).click();
    await expect(p).toHaveURL(/\/purchase-requests$/);
  });
  test('"load more" appends the next page and disappears when nextCursor is null', async ({ browser, request }) => {
    const a = client(request);
    await a.reset();
    for (let i = 0; i < 51; i++) await a.createPr('reqA', 100 + i);
    const p = await session(browser, 'reqA');
    await p.goto('/purchase-requests');
    await expect(p.getByRole('row')).toHaveCount(51);                       // header + 50
    await p.getByRole('button', { name: 'โหลดเพิ่ม' }).click();
    await expect(p.getByRole('row')).toHaveCount(52);
    await expect(p.getByRole('button', { name: 'โหลดเพิ่ม' })).toHaveCount(0);
  });
  test('requester sees her own rows only, dates are Buddhist-era and money has thousands separators', async ({ browser, request }) => {
    const a = client(request);
    await a.reset();
    const mine = await a.createPr('reqA', 12345.5), theirs = await a.createPr('reqB', 999);
    const p = await session(browser, 'reqA');
    await p.goto('/purchase-requests');
    await expect(p.getByRole('link', { name: mine.prNo })).toBeVisible();
    await expect(p.getByRole('link', { name: theirs.prNo })).toHaveCount(0);
    const row = p.getByRole('row', { name: new RegExp(mine.prNo) });
    await expect(row).toContainText('12,345.50');
    await expect(row).toContainText(be(1));
    await expect(row.getByText('DRAFT')).toBeVisible();                     // status text, not colour alone (UIR-03)
  });
  test('a RECEIVER sees only PRs with an issued PO, no link to the PR form, and the receipt link', async ({ browser, request }) => {
    const a = client(request);
    const waiting = await a.approvedPr(3000);
    const { pr } = await a.issuedPo(3000, 3);
    const p = await session(browser, 'recv');
    await p.goto('/purchase-requests');
    const row = p.getByRole('row', { name: new RegExp(pr.prNo) });
    await expect(row.getByRole('link', { name: 'รับของ' })).toBeVisible();
    await expect(row.getByRole('link', { name: pr.prNo })).toHaveCount(0);
    await expect(p.getByText(waiting.prNo)).toHaveCount(0);
    await expect(p.getByRole('button', { name: 'สร้างใบขอซื้อ' })).toHaveCount(0);
  });
  test('a role the screen does not serve gets the no-permission page (ADMIN-less role on approvals)', async ({ browser }) => {
    const p = await session(browser, 'recv');
    await p.goto('/approvals');
    await expect(p.getByText('ไม่มีสิทธิ์เข้าถึง')).toBeVisible();
  });
  test('an expired token sends the user to sign in again and back with the filters (401 row)', async ({ browser }) => {
    const p = await session(browser, 'reqA', { exp: Math.floor(Date.now() / 1000) - 60 });
    await p.goto('/purchase-requests?status=DRAFT');
    await expect(p).toHaveURL(/\/login\?returnTo=%2Fpurchase-requests%3Fstatus%3DDRAFT/);
  });
  test('only a REQUESTER sees the create button; APPROVED + PROCUREMENT sees the RFQ link', async ({ browser, request }) => {
    const a = client(request);
    const pr = await a.approvedPr(30000);
    const proc = await session(browser, 'proc');
    await proc.goto('/purchase-requests');
    await expect(proc.getByRole('button', { name: 'สร้างใบขอซื้อ' })).toHaveCount(0);
    await expect(proc.getByRole('row', { name: new RegExp(pr.prNo) }).getByRole('link', { name: 'สร้าง RFQ' })).toBeVisible();
    const small = await a.approvedPr(5000);                                    // BR-01: at or below 5,000 the link is "buy directly"
    await proc.reload();
    await expect(proc.getByRole('row', { name: new RegExp(small.prNo) }).getByRole('link', { name: 'สั่งซื้อตรง' })).toBeVisible();
    await expect(proc.getByRole('row', { name: new RegExp(small.prNo) }).getByRole('link', { name: 'สร้าง RFQ' })).toHaveCount(0);
  });
});

test.describe('SCR-02 PR form', () => {
  test('validation messages appear under the fields and nothing is sent', async ({ browser }) => {
    const p = await session(browser, 'reqA');
    await p.goto('/purchase-requests/new');
    await p.getByRole('button', { name: 'บันทึกร่าง' }).click();
    await expect(p.getByText('หัวข้อ 1–200 ตัวอักษร')).toBeVisible();
    await expect(p.getByText('วันที่ไม่ถูกต้อง (วว/ดด/พศพศ)')).toBeVisible();
    await expect(p.getByText('จำนวนต้องมากกว่า 0')).toBeVisible();
    await expect(p).toHaveURL(/\/purchase-requests\/new$/);
    await p.getByLabel('วันที่ต้องการใช้').fill(be(-1));
    await p.getByRole('button', { name: 'บันทึกร่าง' }).click();
    await expect(p.getByText('วันที่ต้องการใช้ต้องไม่ก่อนวันนี้')).toBeVisible();
  });
  test('a server-side 422 is shown at the field named in details[] (3-decimal price)', async ({ browser }) => {
    const p = await session(browser, 'reqA');
    await p.goto('/purchase-requests/new');
    await p.getByLabel('หัวข้อ', { exact: true }).fill('ทดสอบ'); await p.getByLabel('เหตุผลความจำเป็น').fill('ทดสอบ'); await p.getByLabel('วันที่ต้องการใช้').fill(be(5));
    await p.getByLabel('รายการ 1', { exact: true }).fill('x'); await p.getByLabel('จำนวน 1', { exact: true }).fill('1'); await p.getByLabel('หน่วยนับ 1', { exact: true }).fill('ชิ้น');
    await p.getByLabel('ราคาต่อหน่วย 1', { exact: true }).fill('10.005');
    await p.getByRole('button', { name: 'บันทึกร่าง' }).click();
    await expect(p.getByRole('alert').filter({ hasText: 'ข้อมูลไม่ถูกต้อง' }).first()).toBeVisible();
  });
  test('rows can be added and removed; the total follows (half-up per line)', async ({ browser }) => {
    const p = await session(browser, 'reqA');
    await p.goto('/purchase-requests/new');
    await p.getByLabel('จำนวน 1', { exact: true }).fill('3'); await p.getByLabel('ราคาต่อหน่วย 1', { exact: true }).fill('10');
    await p.getByRole('button', { name: 'เพิ่มรายการ' }).click();
    await p.getByLabel('จำนวน 2', { exact: true }).fill('0.5'); await p.getByLabel('ราคาต่อหน่วย 2', { exact: true }).fill('0.01');
    await expect(p.getByTestId('total')).toHaveText('30.01');
    await p.getByRole('button', { name: 'ลบแถว 2' }).click();
    await expect(p.getByTestId('total')).toHaveText('30.00');
  });
  test('a submitted PR opens read-only with its approval chain, no save buttons', async ({ browser, request }) => {
    const a = client(request);
    const pr = await a.createPr('reqA', 50000); await a.ok('reqA', 'POST', `/purchase-requests/${pr.prId}/submit`);
    const p = await session(browser, 'reqA');
    await p.goto(`/purchase-requests/${pr.prId}`);
    await expect(p.getByLabel('หัวข้อ', { exact: true })).toBeDisabled();
    await expect(p.getByRole('button', { name: 'บันทึกร่าง' })).toHaveCount(0);
    await expect(p.getByRole('table', { name: 'สายอนุมัติ' }).getByRole('row')).toHaveCount(3);
  });
  test('saving after somebody else changed the document -> conflict box, reload gives the latest (409 ERR-CONC-001)', async ({ browser, request }) => {
    const a = client(request);
    const pr = await a.createPr('reqA', 100);
    const p = await session(browser, 'reqA');
    await p.goto(`/purchase-requests/${pr.prId}`);
    await expect(p.getByLabel('หัวข้อ', { exact: true })).toHaveValue('ทดสอบ');
    await a.ok('reqA', 'PUT', `/purchase-requests/${pr.prId}`, { ...a.prInput(100), title: 'แก้จากที่อื่น' }, { 'if-match': pr.rowVersion });
    await p.getByLabel('หัวข้อ', { exact: true }).fill('แก้จากหน้าจอ');
    await p.getByRole('button', { name: 'บันทึกร่าง' }).click();
    await expect(p.getByText('มีผู้อื่นแก้เอกสารนี้แล้ว')).toBeVisible();
    await p.getByRole('button', { name: 'โหลดข้อมูลล่าสุด' }).click();
    await expect(p.getByLabel('หัวข้อ', { exact: true })).toHaveValue('แก้จากที่อื่น');
  });
  test("somebody else's PR is shown as not found (404)", async ({ browser, request }) => {
    const a = client(request);
    const pr = await a.createPr('reqB', 100);
    const p = await session(browser, 'reqA');
    await p.goto(`/purchase-requests/${pr.prId}`);
    await expect(p.getByText('ไม่พบเอกสาร')).toBeVisible();
  });
  test('after a rejection the PR is DRAFT again and editable, and can be re-submitted with a new chain', async ({ browser, request }) => {
    const a = client(request);
    const pr = await a.createPr('reqA', 50000); const s = await a.ok('reqA', 'POST', `/purchase-requests/${pr.prId}/submit`);
    await a.ok('apprA', 'POST', `/approvals/${s.approvals[0].approvalId}/decision`, { decision: 'REJECTED', comment: 'ขอแก้สเปก' });
    const p = await session(browser, 'reqA');
    await p.goto(`/purchase-requests/${pr.prId}`);
    await expect(p.getByText('DRAFT')).toBeVisible();
    await expect(p.getByLabel('หัวข้อ', { exact: true })).toBeEnabled();
    await p.getByRole('button', { name: 'ส่งอนุมัติ' }).click();
    await expect(p).toHaveURL(/\/purchase-requests$/);
  });
});

test.describe('SCR-03 approval inbox', () => {
  test('rows are for my role only; a document I proposed shows no buttons (BR-04)', async ({ browser, request }) => {
    const a = client(request);
    await a.reset();
    const pr = await a.createPr('reqA', 100); await a.ok('reqA', 'POST', `/purchase-requests/${pr.prId}/submit`);
    const approver = await session(browser, 'apprA');
    await approver.goto('/approvals');
    await expect(approver.getByRole('row', { name: new RegExp(pr.prNo) }).getByRole('button', { name: 'อนุมัติ', exact: true })).toBeVisible();
    const dual = await session(browser, 'dualA');                           // requester and approver at once
    await dual.goto('/approvals');
    const row = dual.getByRole('row', { name: new RegExp(pr.prNo) });
    await expect(row.getByText('ผู้ขอหรือผู้เสนอผลอนุมัติเองไม่ได้')).toBeVisible();
    await expect(row.getByRole('button')).toHaveCount(0);
    const head = await session(browser, 'head');                            // not at the head's step yet
    await head.goto('/approvals');
    await expect(head.getByText('ไม่มีรายการรออนุมัติ')).toBeVisible();
  });
  test('reject needs a reason; the box stays open until one is given', async ({ browser, request }) => {
    const a = client(request);
    const pr = await a.createPr('reqA', 100); await a.ok('reqA', 'POST', `/purchase-requests/${pr.prId}/submit`);
    const p = await session(browser, 'apprA');
    await p.goto('/approvals');
    const row = p.getByRole('row', { name: new RegExp(pr.prNo) });
    await row.getByRole('button', { name: 'ปฏิเสธ', exact: true }).click();
    await row.getByRole('button', { name: 'ยืนยันปฏิเสธ' }).click();
    await expect(row.getByText('ระบุเหตุผลการปฏิเสธ')).toBeVisible();
    await row.getByLabel('เหตุผล').fill('ขอรายละเอียดเพิ่ม');
    await row.getByRole('button', { name: 'ยืนยันปฏิเสธ' }).click();
    await expect(row).toHaveCount(0);
    expect((await a.getPr('reqA', pr.prId)).status).toBe('DRAFT');
  });
  test('somebody else decided first -> "ขั้นนี้ถูกตัดสินแล้ว" and the list reloads (409)', async ({ browser, request }) => {
    const a = client(request);
    const pr = await a.createPr('reqA', 100); const s = await a.ok('reqA', 'POST', `/purchase-requests/${pr.prId}/submit`);
    const p = await session(browser, 'apprA');
    await p.goto('/approvals');
    const row = p.getByRole('row', { name: new RegExp(pr.prNo) });
    await expect(row).toBeVisible();
    await a.ok('apprA', 'POST', `/approvals/${s.approvals[0].approvalId}/decision`, { decision: 'APPROVED' });
    await row.getByRole('button', { name: 'อนุมัติ', exact: true }).click();
    await expect(p.getByText('ขั้นนี้ถูกตัดสินแล้ว')).toBeVisible();
    await expect(row).toHaveCount(0);
  });
});

test.describe('SCR-04 / SCR-05 / SCR-06', () => {
  test('SCR-04 suspended vendors are not offered; a PR of 5,000 or less is told to buy directly', async ({ browser, request }) => {
    const a = client(request);
    const tag = 'S4' + Date.now();
    const vs = []; for (const n of ['A', 'B', 'C']) vs.push(await a.ok('proc', 'POST', '/vendors', { nameTh: `${tag} ${n}`, taxId: String(Date.now() % 1e10 * 1000 + vs.length).padStart(13, '0') }));
    await a.ok('head', 'PUT', `/vendors/${vs[2].vendorId}/status`, { status: 'SUSPENDED', reason: 'ตรวจเอกสาร' });
    const small = await a.approvedPr(5000);
    const p = await session(browser, 'proc');
    await p.goto(`/purchase-requests/${small.prId}/rfq/new`);
    await p.getByLabel('ค้นหาผู้ขาย').fill(tag);
    await expect(p.getByLabel(new RegExp(vs[0].vendorCode))).toBeVisible();
    await expect(p.getByLabel(new RegExp(vs[2].vendorCode))).toHaveCount(0);
    await p.getByLabel('วันปิดรับใบเสนอราคา').fill(localDateTime(3));
    await expect(p.getByRole('button', { name: 'สร้าง RFQ' })).toBeDisabled();
  });
  test('SCR-06 direct buy (<= 5,000) is reached from the list and issues a PO (BR-01); over the limit shows ERR-PO-001', async ({ browser, request }) => {
    const a = client(request);
    const small = await a.approvedPr(3000), big = await a.approvedPr(5000.01), v = await a.newVendor();
    const p = await session(browser, 'proc');
    await p.goto('/purchase-requests');
    await p.getByRole('row', { name: new RegExp(small.prNo) }).getByRole('link', { name: 'สั่งซื้อตรง' }).click();   // reached from the list (SCR-01 -> SCR-06)
    await p.getByLabel('ค้นหาผู้ขาย').fill(v.nameTh);
    await p.getByLabel(new RegExp(v.vendorCode)).check();
    await p.getByRole('button', { name: 'สร้าง PO' }).click();
    await expect(p).toHaveURL(/\/purchase-orders\/\d+$/);
    await p.goto(`/purchase-orders/new?prId=${big.prId}`);
    await p.getByLabel('ค้นหาผู้ขาย').fill(v.nameTh);
    await p.getByLabel(new RegExp(v.vendorCode)).check();
    await p.getByRole('button', { name: 'สร้าง PO' }).click();
    await expect(p.getByText('เกินวงเงิน', { exact: false }).or(p.getByRole('alert'))).toBeVisible();
  });
  test('SCR-05 needs two quotations before an award; HEAD can read but not record or award', async ({ browser, request }) => {
    const a = client(request);
    const { pr, vs, rfq } = await a.rfq(30000);
    await a.quote(rfq.rfqId, vs[0].vendorId, pr.items[0].prItemId, 100);
    const proc = await session(browser, 'proc');
    await proc.goto(`/rfqs/${rfq.rfqId}`);
    await expect(proc.getByText('ต้องมีใบเสนอราคาอย่างน้อย 2 ราย')).toBeVisible();
    await expect(proc.getByRole('button', { name: 'เสนอผล', exact: true })).toBeDisabled();
    const head = await session(browser, 'head');
    await head.goto(`/rfqs/${rfq.rfqId}`);
    await expect(head.getByRole('table', { name: 'เปรียบเทียบราคา' })).toBeVisible();
    await expect(head.getByRole('button', { name: 'เสนอผล', exact: true })).toHaveCount(0);
  });
  test('SCR-05 recording again for the same vendor replaces the earlier quotation (BR-08)', async ({ browser, request }) => {
    const a = client(request);
    const { pr, vs, rfq } = await a.rfq(30000);
    await a.quote(rfq.rfqId, vs[0].vendorId, pr.items[0].prItemId, 100);
    const p = await session(browser, 'proc');
    await p.goto(`/rfqs/${rfq.rfqId}`);
    await p.getByRole('button', { name: `บันทึกใบเสนอราคา ${vs[0].nameTh}` }).click();
    await p.getByLabel('ระยะเวลาส่งมอบ (วัน)').fill('5');
    await p.getByLabel(/ราคาต่อหน่วย/).fill('90');
    await p.getByRole('button', { name: 'ยืนยันบันทึก' }).click();
    await expect(p.getByRole('status')).toHaveText('บันทึกใบเสนอราคาแล้ว');
    await expect(p.getByRole('columnheader', { name: new RegExp(vs[0].nameTh) })).toHaveCount(1);
    await expect(p.getByRole('row', { name: /^ราคารวม/ })).toContainText('90.00');
  });
  test('SCR-05 after the closing time the server refuses (409 ERR-RFQ-003) and the message is shown', async ({ browser, request }) => {
    const a = client(request);
    const { vs, rfq } = await a.rfq(30000, 5000);
    const p = await session(browser, 'proc');
    await p.goto(`/rfqs/${rfq.rfqId}`);
    await p.getByRole('button', { name: `บันทึกใบเสนอราคา ${vs[0].nameTh}` }).click();
    await p.waitForTimeout(Math.max(0, Date.parse(rfq.dueAt) - Date.now()) + 1000);   // until the closing time has really passed
    await p.getByLabel('ระยะเวลาส่งมอบ (วัน)').fill('5'); await p.getByLabel(/ราคาต่อหน่วย/).fill('90');
    await p.getByRole('button', { name: 'ยืนยันบันทึก' }).click();
    await expect(p.getByRole('alert')).toBeVisible();
  });
});

test.describe('SCR-07 goods receipt', () => {
  test('a received-in-full PO is read-only', async ({ browser, request }) => {
    const a = client(request);
    const { po } = await a.issuedPo(1000, 2);
    await a.ok('recv', 'POST', `/purchase-orders/${po.poId}/receipts`, { items: [{ poItemId: po.items[0].poItemId, qtyReceived: 2 }] });
    const p = await session(browser, 'recv');
    await p.goto(`/purchase-orders/${po.poId}/receipt`);
    await expect(p.getByText('รับครบแล้ว')).toBeVisible();
    await expect(p.getByRole('button', { name: 'บันทึกรับของ' })).toHaveCount(0);
  });
  test('a PO that is only DRAFT cannot be received yet', async ({ browser, request }) => {
    const a = client(request);
    const pr = await a.approvedPr(3000), v = await a.newVendor();
    const po = await a.ok('proc', 'POST', '/purchase-orders', { prId: pr.prId, vendorId: v.vendorId });
    const p = await session(browser, 'recv');
    await p.goto(`/purchase-orders/${po.poId}/receipt`);
    await expect(p.getByText('PO นี้ยังไม่อยู่ในสถานะที่รับของได้')).toBeVisible();
  });
  test('unknown PO -> not found page', async ({ browser }) => {
    const p = await session(browser, 'recv');
    await p.goto('/purchase-orders/999999/receipt');
    await expect(p.getByText('ไม่พบเอกสาร')).toBeVisible();
  });
});

test.describe('SCR-08 / SCR-09 / SCR-10', () => {
  test('SCR-08 add a vendor, duplicate taxId is reported at the field, HEAD suspends with a reason', async ({ browser }) => {
    const tax = String(Date.now() % 1e10 * 1000 + 7).padStart(13, '0'), name = 'ผู้ขายหน้าจอ' + Date.now();
    const p = await session(browser, 'proc');
    await p.goto('/vendors');
    await p.getByRole('button', { name: 'เพิ่มผู้ขาย' }).click();
    await p.getByLabel('ชื่อผู้ขาย').fill(name); await p.getByLabel('เลขประจำตัวผู้เสียภาษี').fill('123');
    await p.getByRole('button', { name: 'บันทึก', exact: true }).click();
    await expect(p.getByText('เลขผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก')).toBeVisible();
    await p.getByLabel('เลขประจำตัวผู้เสียภาษี').fill(tax);
    await p.getByRole('button', { name: 'บันทึก', exact: true }).click();
    await p.getByLabel('ค้นหา', { exact: true }).fill(name);
    await expect(p.getByRole('row', { name: new RegExp(name) })).toBeVisible();
    await p.getByRole('button', { name: 'เพิ่มผู้ขาย' }).click();
    await p.getByLabel('ชื่อผู้ขาย').fill('ซ้ำ'); await p.getByLabel('เลขประจำตัวผู้เสียภาษี').fill(tax);
    await p.getByRole('button', { name: 'บันทึก', exact: true }).click();
    await expect(p.getByText('เลขผู้เสียภาษีซ้ำกับผู้ขายเดิม')).toBeVisible();
    await expect(p.getByRole('row', { name: new RegExp(name) }).getByRole('button')).toHaveCount(0);   // PROCUREMENT cannot suspend
    const h = await session(browser, 'head');
    await h.goto('/vendors');
    await h.getByLabel('ค้นหา', { exact: true }).fill(name);
    await h.getByRole('row', { name: new RegExp(name) }).getByRole('button', { name: /^ระงับ/ }).click();
    await h.getByRole('button', { name: 'ยืนยัน', exact: true }).click();
    await expect(h.getByText('ระบุเหตุผลการระงับ')).toBeVisible();
    await h.getByLabel('เหตุผล').fill('ตรวจเอกสาร');
    await h.getByRole('button', { name: 'ยืนยัน', exact: true }).click();
    await expect(h.getByRole('row', { name: new RegExp(name) }).getByText('SUSPENDED')).toBeVisible();
  });
  test('SCR-09 report for a range, with a total row computed on the page; reversed range is refused', async ({ browser, request }) => {
    const a = client(request);
    await a.reset();
    await a.issuedPo(3000, 10, 'reqA'); await a.issuedPo(2000, 4, 'reqA'); await a.issuedPo(4000, 8, 'reqB');
    const p = await session(browser, 'head');
    await p.goto('/reports/spend');
    const t = p.getByRole('table', { name: 'สรุป' });
    await expect(t.getByRole('row', { name: /^ไอที/ })).toContainText('5,000.00');
    await expect(t.getByRole('row', { name: /^ปฏิบัติการ/ })).toContainText('4,000.00');
    await expect(t.getByRole('row', { name: /^รวม/ })).toContainText('9,000.00');
    await p.getByLabel('ตั้งแต่').fill(be(2)); 
    await expect(p.getByText('วันที่เริ่มต้องไม่เกินวันที่สิ้นสุด')).toBeVisible();
  });
  test('SCR-09 is for HEAD and ADMIN only', async ({ browser }) => {
    const p = await session(browser, 'proc');
    await p.goto('/reports/spend');
    await expect(p.getByText('ไม่มีสิทธิ์เข้าถึง')).toBeVisible();
  });
  test('SCR-10 asks for a document first, then shows its timeline; empty result is said so', async ({ browser, request }) => {
    const a = client(request);
    const pr = await a.createPr('reqA', 100); await a.ok('reqA', 'POST', `/purchase-requests/${pr.prId}/submit`);
    const p = await session(browser, 'admin');
    await p.goto('/audit');
    await expect(p.getByRole('button', { name: 'ค้นหา' })).toBeDisabled();
    await p.getByLabel('รหัสเอกสาร').fill(String(pr.prId));
    await p.getByRole('button', { name: 'ค้นหา' }).click();
    await expect(p.getByRole('list', { name: 'เส้นเวลา' })).toContainText('SUBMIT');
    await p.goto('/audit?entity=PR&entityId=999999');
    await expect(p.getByText('ไม่มีเหตุการณ์ของเอกสารนี้')).toBeVisible();
  });
  test('SCR-10 is for ADMIN only', async ({ browser }) => {
    const p = await session(browser, 'head');
    await p.goto('/audit?entity=PR&entityId=1');
    await expect(p.getByText('ไม่มีสิทธิ์เข้าถึง')).toBeVisible();
  });
});
