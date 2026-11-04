---
code: PRC-04
module: PRC
card_type: screen
journey: JNY-02
journey_phase: 2
screen_ref: SCR-04
supports_journeys: []
status: draft
sprint: 2
priority: must
estimate:
  dev: 5
  qa: 3
depends_on:
- PRC-03
- PRC-08
acceptance_refs:
- TC-17
- TC-18
- TC-19
- TC-20
- TC-21
source_refs:
- JNY-02
- UC-04
- FR-05
- BR-01
- BR-02
- BR-11
- SCR-04
owned_touchpoints:
- createRfq
consumed_touchpoints:
- listVendors
tables:
- rfq
- rfq_vendor
slicing_reason: หนึ่งหน้าจอ หนึ่งการ์ด
---

# PRC-04 — สร้าง RFQ และเชิญผู้ขาย

## Value

เจ้าหน้าที่จัดซื้อสร้าง RFQ จากใบขอซื้อที่อนุมัติแล้วและเชิญผู้ขายอย่างน้อย 3 ราย เมื่อวงเงินเกินเกณฑ์ซื้อตรง

## Scope

- หน้าจอ สร้าง RFQ และเชิญผู้ขาย (SCR-04) ตามข้อกำหนดหน้าจอ
- เลือกผู้ขายจากรายการที่ใช้งานได้
- แจ้งให้ซื้อตรงเมื่อวงเงินไม่เกินเกณฑ์
- เรียก API: createRfq

## Acceptance Criteria

<!-- generated:ac -->
| Ref | กรณีทดสอบ | ประเภท | ผลที่คาดหวัง |
|---|---|---|---|
| [TC-17](../../design/09-qa-and-test/cases/tc-17-boundary-create-rfq.md) | สร้าง RFQ จาก PR วงเงิน 5,000.01 | Boundary | 201 `rfqNo` ถูกรูปแบบ PR เป็น `IN_SOURCING` |
| [TC-18](../../design/09-qa-and-test/cases/tc-18-boundary-create-rfq.md) | สร้าง RFQ จาก PR วงเงิน 5,000.00 | Boundary | 422 `ERR-RFQ-006` (ให้ซื้อตรง) |
| [TC-19](../../design/09-qa-and-test/cases/tc-19-negative-create-rfq.md) | เชิญผู้ขายเพียง 2 ราย | Negative | 422 `ERR-RFQ-001` |
| [TC-20](../../design/09-qa-and-test/cases/tc-20-negative-create-rfq.md) | เชิญผู้ขายที่ถูกระงับ | Negative | 422 `ERR-VND-002` |
| [TC-21](../../design/09-qa-and-test/cases/tc-21-negative-create-rfq.md) | สร้าง RFQ จาก PR ที่ยังไม่อนุมัติ | Negative | 409 `ERR-STATE-002` |
<!-- /generated -->

## Dependency / Assumption

- `PRC-03`
- `PRC-08`

- ประมาณการ story point เป็นค่าตั้งต้นที่ AI เสนอ ทีมต้องปรับเทียบ (planning poker) ก่อนใช้วางรอบ

## Out of Scope

- การบันทึกใบเสนอราคา (PRC-05)

## Source Refs

<!-- generated:refs -->
| Ref | ชนิด | ชื่อ |
|---|---|---|
| [JNY-02](../../design/02-bu-process/journeys/jny-02-sourcing-and-award.md) | Journey | จัดหาและเลือกผู้ชนะ |
| [UC-04](../../design/02-bu-process/usecases/uc-04-rfq-and-quotation.md) | Use Case | ขอใบเสนอราคาและบันทึกใบเสนอราคา |
| [FR-05](../../design/01-requirements/functional/fr-05-create-rfq.md) | ข้อกำหนดเชิงหน้าที่ | สร้าง RFQ และเชิญผู้ขาย |
| [BR-01](../../design/01-requirements/business-rules/br-01-direct-purchase-limit.md) | กฎธุรกิจ | ซื้อตรงวงเงินต่ำ |
| [BR-02](../../design/01-requirements/business-rules/br-02-rfq-min-vendors.md) | กฎธุรกิจ | RFQ เชิญผู้ขายอย่างน้อย 3 ราย |
| [BR-11](../../design/01-requirements/business-rules/br-11-suspended-vendor.md) | กฎธุรกิจ | ผู้ขายถูกระงับ |
| [SCR-04](../../design/05-ui-desc/screens/scr-04-rfq-create.md) | หน้าจอ | สร้าง RFQ และเชิญผู้ขาย |
<!-- /generated -->

## Implementation Touchpoints

<!-- generated:touchpoints -->
| operationId | Method Path | การเป็นเจ้าของ |
|---|---|---|
| `createRfq` | POST `/rfqs` | เป็นเจ้าของ |
| `listVendors` | GET `/vendors` | ใช้ร่วม (เจ้าของ PRC-08) |

ตารางข้อมูลที่เกี่ยวข้อง: `rfq`, `rfq_vendor`
<!-- /generated -->

## Change History

| รุ่น | รายละเอียด |
|---|---|
| 1.0 | ร่างแรกจาก design pieces ผ่านการตรวจ gate โดยสคริปต์ รอทีมตรวจรับ |
