---
code: PRC-S1
module: PRC
card_type: supporting
journey: JNY-01
journey_phase: 0
supports_journeys: []
status: draft
sprint: 1
priority: must
estimate:
  dev: 8
  qa: 3
depends_on: []
acceptance_refs:
- TC-03
- TC-04
- TC-24
- TC-40
- TC-47
- TC-48
source_refs:
- JNY-01
- FR-13
- FR-14
- NFR-02
- NFR-04
owned_touchpoints: []
consumed_touchpoints: []
tables:
- app_user
- approval
- audit_log
- award
- department
- doc_sequence
- goods_receipt
- gr_item
- po_item
- pr_item
- purchase_order
- purchase_request
- quotation
- quotation_item
- rfq
- rfq_vendor
- vendor
slicing_reason: งานไม่มีหน้าจอ ต้องเสร็จก่อนทุก Journey
---

# PRC-S1 — ฐานข้อมูลและการออกเลขเอกสาร

## Value

ฐานข้อมูลตาม schema พร้อมขั้นตอนออกเลขเอกสารที่ไม่ซ้ำ และสิทธิ์ของตาราง audit ที่แอปแก้ไม่ได้ เป็นฐานของทุกการ์ด

## Scope

- สร้างตารางทั้ง 17 ตาราง ดัชนี และ constraint ตาม `sql/schema.sql`
- ขั้นตอน `usp_next_doc_no` ออกเลข PR, RFQ, PO, GR
- ปฏิเสธ UPDATE/DELETE ตาราง `audit_log` สำหรับบัญชีแอป

## Acceptance Criteria

<!-- generated:ac -->
| Ref | กรณีทดสอบ | ประเภท | ผลที่คาดหวัง |
|---|---|---|---|
| [TC-03](../../design/09-qa-and-test/cases/tc-03-negative-create-purchase-request.md) | จำนวนเป็นศูนย์ | Negative | 422 `ERR-VAL-001` ที่ `items[0].quantity` |
| [TC-04](../../design/09-qa-and-test/cases/tc-04-negative-update-purchase-request.md) | แก้ draft ด้วยเวอร์ชันล้าสมัย | Negative | B ได้ 409 `ERR-CONC-001` |
| [TC-24](../../design/09-qa-and-test/cases/tc-24-positive-record-quotation.md) | บันทึกใบเสนอราคาซ้ำ | Positive | ฉบับแรก `isActive` = false ฉบับหลัง true เหลือฉบับที่ใช้งาน 1 ฉบับ |
| [TC-40](../../design/09-qa-and-test/cases/tc-40-negative-create-vendor.md) | เพิ่มผู้ขายเลขภาษีซ้ำ | Negative | 409 `ERR-VND-001` |
| [TC-47](../../design/09-qa-and-test/cases/tc-47-security-list-audit-logs.md) | บัญชีแอปแก้ audit ไม่ได้ | Security | ถูกปฏิเสธโดยฐานข้อมูล (NFR-02) |
| [TC-48](../../design/09-qa-and-test/cases/tc-48-concurrency-create-purchase-request.md) | ออกเลขเอกสารพร้อมกัน | Concurrency | เลข 1,000 ค่าไม่ซ้ำ ต่อเนื่อง (NFR-04) |
<!-- /generated -->

## Dependency / Assumption

- ไม่มี

- ประมาณการ story point เป็นค่าตั้งต้นที่ AI เสนอ ทีมต้องปรับเทียบ (planning poker) ก่อนใช้วางรอบ

## Out of Scope

- ข้อมูลตั้งต้นของหน่วยงานและผู้ใช้ (รับจาก SSO)

## Source Refs

<!-- generated:refs -->
| Ref | ชนิด | ชื่อ |
|---|---|---|
| [JNY-01](../../design/02-bu-process/journeys/jny-01-request-and-approval.md) | Journey | ขอซื้อและอนุมัติ |
| [FR-13](../../design/01-requirements/functional/fr-13-audit-trail.md) | ข้อกำหนดเชิงหน้าที่ | บันทึก audit trail |
| [FR-14](../../design/01-requirements/functional/fr-14-document-numbering.md) | ข้อกำหนดเชิงหน้าที่ | ออกเลขเอกสารอัตโนมัติ |
| [NFR-02](../../design/01-requirements/nfr/nfr-02-audit-integrity.md) | ข้อกำหนดที่ไม่ใช่เชิงหน้าที่ | ความสมบูรณ์ audit trail |
| [NFR-04](../../design/01-requirements/nfr/nfr-04-numbering-correctness.md) | ข้อกำหนดที่ไม่ใช่เชิงหน้าที่ | ความถูกต้องของเลขเอกสาร |
<!-- /generated -->

## Implementation Touchpoints

<!-- generated:touchpoints -->
ไม่มี API operation ในการ์ดนี้

ตารางข้อมูลที่เกี่ยวข้อง: `app_user`, `approval`, `audit_log`, `award`, `department`, `doc_sequence`, `goods_receipt`, `gr_item`, `po_item`, `pr_item`, `purchase_order`, `purchase_request`, `quotation`, `quotation_item`, `rfq`, `rfq_vendor`, `vendor`
<!-- /generated -->

## Change History

| รุ่น | รายละเอียด |
|---|---|
| 1.0 | ร่างแรกจาก design pieces ผ่านการตรวจ gate โดยสคริปต์ รอทีมตรวจรับ |
