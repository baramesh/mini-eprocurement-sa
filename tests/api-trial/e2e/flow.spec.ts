import { test, expect } from '@playwright/test';
import { client } from '../specs/helpers';
import { be, localDateTime, session } from './helpers';

// The whole procurement journey through the screens, each person in their own browser session:
// requester drafts and submits -> approvers approve -> procurement runs the RFQ and awards -> head approves the award
// -> procurement creates and issues the PO -> receiver books two receipts -> PR is CLOSED.
// Everything is driven by what design/05-ui-desc says; set-up that is not under test (vendors) goes through the API.
test('journey: PR -> approval -> RFQ -> award -> PO -> goods receipt -> CLOSED', async ({ browser, request }) => {
  test.setTimeout(120_000);
  const a = client(request);
  const tag = 'E2E' + Date.now();
  const vendors = [];
  for (const [i, n] of ['A', 'B', 'C'].entries()) vendors.push(await a.ok('proc', 'POST', '/vendors', { nameTh: `${tag} ${n}`, taxId: String(Date.now() % 1e10 * 1000 + i).padStart(13, '0') }));

  // ---- SCR-02 requester creates, saves and submits ------------------------------------------------------
  const req = await session(browser, 'reqA');
  await req.goto('/purchase-requests');
  await req.getByRole('button', { name: 'สร้างใบขอซื้อ' }).click();
  await expect(req).toHaveURL(/\/purchase-requests\/new$/);
  await req.getByLabel('หัวข้อ', { exact: true }).fill(`${tag} โน้ตบุ๊ก`);
  await req.getByLabel('เหตุผลความจำเป็น').fill('ทดแทนเครื่องเก่า');
  await req.getByLabel('วันที่ต้องการใช้').fill(be(30));
  await req.getByLabel('รายการ 1', { exact: true }).fill('โน้ตบุ๊ก');
  await req.getByLabel('จำนวน 1', { exact: true }).fill('10');
  await req.getByLabel('หน่วยนับ 1', { exact: true }).fill('เครื่อง');
  await req.getByLabel('ราคาต่อหน่วย 1', { exact: true }).fill('5000');
  await expect(req.getByTestId('total')).toHaveText('50,000.00');                 // UIR-02 and live total
  await expect(req.getByText('1. DEPT_APPROVER → 2. PROCUREMENT_HEAD')).toBeVisible();   // BR-03 preview
  await req.getByRole('button', { name: 'บันทึกร่าง' }).click();
  await expect(req.getByRole('status')).toHaveText('บันทึกร่างแล้ว');
  await expect(req).toHaveURL(/\/purchase-requests\/\d+$/);
  const prId = Number(req.url().split('/').pop());
  await expect(req.getByRole('heading', { level: 1 })).toContainText(/PR-\d{4}-\d{5}/);
  await req.getByRole('button', { name: 'ส่งอนุมัติ' }).click();
  await expect(req).toHaveURL(/\/purchase-requests$/);
  await expect(req.getByRole('row', { name: new RegExp(tag) }).getByText('SUBMITTED')).toBeVisible();

  // ---- SCR-03 two approvers in order -------------------------------------------------------------------
  const appr = await session(browser, 'apprA');
  await appr.goto('/approvals');
  const row = appr.getByRole('row', { name: new RegExp(tag) });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'อนุมัติ', exact: true }).click();
  await expect(row).toHaveCount(0);
  const head = await session(browser, 'head');
  await head.goto('/approvals');
  await head.getByRole('row', { name: new RegExp(tag) }).getByRole('button', { name: 'อนุมัติ', exact: true }).click();
  await expect(head.getByRole('row', { name: new RegExp(tag) })).toHaveCount(0);

  // ---- SCR-01 -> SCR-04 procurement opens the RFQ form from the list ---------------------------------------
  const proc = await session(browser, 'proc');
  await proc.goto('/purchase-requests');
  await proc.getByRole('row', { name: new RegExp(tag) }).getByRole('link', { name: 'สร้าง RFQ' }).click();
  await expect(proc).toHaveURL(new RegExp(`/purchase-requests/${prId}/rfq/new$`));
  await proc.getByLabel('วันปิดรับใบเสนอราคา').fill(localDateTime(7));
  await proc.getByLabel('ค้นหาผู้ขาย').fill(tag);
  const create = proc.getByRole('button', { name: 'สร้าง RFQ' });
  await expect(create).toBeDisabled();
  for (const v of vendors.slice(0, 2)) await proc.getByLabel(new RegExp(v.vendorCode)).check();
  await expect(proc.getByTestId('picked')).toHaveText('2');
  await expect(create).toBeDisabled();                                           // BR-02: three needed
  await proc.getByLabel(new RegExp(vendors[2].vendorCode)).check();
  await expect(create).toBeEnabled();
  await create.click();
  await expect(proc).toHaveURL(/\/rfqs\/\d+$/);
  const rfqId = Number(proc.url().split('/').pop());

  // ---- SCR-05 quotations from three vendors, then a non-lowest award ---------------------------------------
  const prices = [52000, 48000, 50000];                                           // lowest is vendor B
  for (const [i, v] of vendors.entries()) {
    await proc.getByRole('button', { name: `บันทึกใบเสนอราคา ${v.nameTh}` }).click();
    await proc.getByLabel('ระยะเวลาส่งมอบ (วัน)').fill(String(7 + i));
    await proc.getByLabel('ราคาต่อหน่วย โน้ตบุ๊ก').fill(String(prices[i] / 10));
    await proc.getByRole('button', { name: 'ยืนยันบันทึก' }).click();
    await expect(proc.getByRole('status')).toHaveText('บันทึกใบเสนอราคาแล้ว');
  }
  const table = proc.getByRole('table', { name: 'เปรียบเทียบราคา' });
  await expect(table.getByRole('columnheader', { name: new RegExp(`${vendors[1].nameTh} \\(ต่ำสุด\\)`) })).toBeVisible();
  await expect(table.getByRole('row', { name: /^ราคารวม/ })).toContainText('48,000.00');
  const award = proc.getByRole('button', { name: 'เสนอผล', exact: true });
  await expect(award).toBeDisabled();
  await proc.getByLabel(`เลือก ${vendors[2].nameTh}`).check();                   // not the lowest -> reason needed (BR-06)
  await expect(award).toBeDisabled();
  await proc.getByLabel('เหตุผลที่ไม่เลือกราคาต่ำสุด').fill('x'.repeat(19));
  await expect(proc.getByText('19/20')).toBeVisible();
  await expect(award).toBeDisabled();
  await proc.getByLabel('เหตุผลที่ไม่เลือกราคาต่ำสุด').fill('ผู้ขายนี้รับประกันสามปีและส่งมอบเร็ว');
  await expect(award).toBeEnabled();
  await award.click();
  await expect(proc.getByText('รออนุมัติผล')).toBeVisible();
  await expect(proc.getByText('AWARD_PENDING')).toBeVisible();

  // ---- SCR-03 head approves the award; link leads back to SCR-05 -----------------------------------------
  await head.goto('/approvals');
  const awardRow = head.getByRole('row', { name: /RFQ-/ }).filter({ hasText: tag });
  await awardRow.getByRole('link', { name: /RFQ-/ }).click();                       // the approver reads what is proposed before deciding
  await expect(head.getByRole('columnheader', { name: new RegExp(`${vendors[2].nameTh}.*เสนอเป็นผู้ชนะ`) })).toBeVisible();
  await expect(head.getByText('เหตุผลที่เสนอ: ผู้ขายนี้รับประกันสามปีและส่งมอบเร็ว')).toBeVisible();
  await head.goto('/approvals');
  await awardRow.getByRole('button', { name: 'อนุมัติ', exact: true }).click();
  await expect(awardRow).toHaveCount(0);

  // ---- SCR-05 -> SCR-06 create and issue the PO ------------------------------------------------------
  await proc.reload();
  await expect(proc.getByText('AWARDED')).toBeVisible();
  await proc.getByRole('button', { name: 'ไปออก PO' }).click();
  await expect(proc).toHaveURL(new RegExp(`/purchase-orders/new\\?prId=${prId}&rfqId=${rfqId}`));
  await expect(proc.getByText(`ผู้ชนะ: ${vendors[2].nameTh}`)).toBeVisible();       // the winner is shown before the PO is created
  await proc.getByRole('button', { name: 'สร้าง PO' }).click();
  await expect(proc).toHaveURL(/\/purchase-orders\/\d+$/);
  const poId = Number(proc.url().split('/').pop());
  await expect(proc.getByText(`ผู้ขาย: ${vendors[2].nameTh}`)).toBeVisible();      // the winner, not the lowest
  await expect(proc.getByText('50,000.00').first()).toBeVisible();
  await expect(proc.getByText('DRAFT')).toBeVisible();
  await proc.getByRole('button', { name: 'ออก PO' }).click();
  await expect(proc.getByText('ISSUED')).toBeVisible();

  // ---- SCR-07 receiver books two receipts --------------------------------------------------------------
  const recv = await session(browser, 'recv');
  await recv.goto('/purchase-requests');                                          // the receiver finds the PO through the list (SCR-01 -> SCR-07)
  await recv.getByRole('row', { name: new RegExp(tag) }).getByRole('link', { name: 'รับของ' }).click();
  await expect(recv).toHaveURL(new RegExp(`/purchase-orders/${poId}/receipt$`));
  const save = recv.getByRole('button', { name: 'บันทึกรับของ' });
  await recv.getByLabel('รับ โน้ตบุ๊ก').fill('4');
  await recv.getByLabel('ปฏิเสธ โน้ตบุ๊ก').fill('1');
  await save.click();
  await expect(recv.getByRole('status')).toContainText(/GR-\d{4}-\d{5}/);
  await expect(recv.getByText('PARTIALLY_RECEIVED')).toBeVisible();
  await expect(recv.getByRole('row', { name: /โน้ตบุ๊ก/ })).toContainText('คงเหลือ'.length ? '6' : '');
  await recv.getByLabel('รับ โน้ตบุ๊ก').fill('7');
  await expect(recv.getByText('เกินจำนวนคงเหลือ')).toBeVisible();                 // BR-10
  await expect(save).toBeDisabled();
  await recv.getByLabel('รับ โน้ตบุ๊ก').fill('6');
  await expect(save).toBeEnabled();
  await save.click();
  await expect(recv.getByText('รับครบแล้ว')).toBeVisible();
  await expect(recv.getByText('RECEIVED', { exact: true })).toBeVisible();

  // ---- the PR is closed and the audit trail shows the journey ---------------------------------------
  await req.goto('/purchase-requests');
  await expect(req.getByRole('row', { name: new RegExp(tag) }).getByText('CLOSED')).toBeVisible();
  const adm = await session(browser, 'admin');
  await adm.goto(`/audit?entity=PR&entityId=${prId}`);
  const trail = await adm.getByRole('list', { name: 'เส้นเวลา' }).innerText();
  expect(trail.indexOf('SUBMIT')).toBeGreaterThan(-1);
  expect(trail.indexOf('APPROVE')).toBeGreaterThan(trail.indexOf('SUBMIT'));
});
