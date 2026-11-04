---
code: PRC-S3
module: PRC
card_type: supporting
journey: JNY-01
journey_phase: 0
supports_journeys: []
status: draft
sprint: 1
priority: must
estimate:
  dev: 5
  qa: 3
depends_on:
- PRC-S1
- PRC-S2
acceptance_refs:
- AC-03-01
- AC-03-02
- AC-03-03
- AC-03-04
- AC-04-01
- AC-04-03
- AC-08-05
- AC-13-01
source_refs:
- JNY-01
- FR-04
- FR-13
- BR-03
- BR-04
- BR-05
owned_touchpoints: []
consumed_touchpoints: []
tables:
- app_user
- approval
- audit_log
- department
slicing_reason: ตรรกะที่ใช้ร่วมระหว่างอนุมัติ PR และผลเลือกผู้ชนะ จึงแยกเป็นการ์ดสนับสนุน
---

# PRC-S3 — สายอนุมัติและ audit trail

## Value

กลไกสายอนุมัติตามวงเงินและการบันทึก audit trail ที่การ์ดอื่นเรียกใช้ รวมกฎแยกหน้าที่ (ห้ามอนุมัติของตนเอง)

## Scope

- สร้างสายอนุมัติจากวงเงินรวมตามกฎของโจทย์
- ตรวจกฎแยกหน้าที่ก่อนบันทึกผลตัดสิน
- ตัวเขียน audit ที่ทุกการเปลี่ยนสถานะเรียกใช้

## Acceptance Criteria

<!-- generated:ac -->
| Ref | เกณฑ์ตรวจรับ | ประเภท | ผลที่คาดหวัง |
|---|---|---|---|
| [AC-03-01](../../design/01-requirements/acceptance-criteria/ac-03-01-boundary-submit-purchase-request.md) | ส่ง PR ไม่เกิน 20,000 | Boundary | สร้างอนุมัติ 1 ขั้น (`DEPT_APPROVER`) |
| [AC-03-02](../../design/01-requirements/acceptance-criteria/ac-03-02-boundary-submit-purchase-request.md) | ส่ง PR เกิน 20,000 หนึ่งสตางค์ | Boundary | สร้างอนุมัติ 2 ขั้น (`DEPT_APPROVER`, `PROCUREMENT_HEAD`) |
| [AC-03-03](../../design/01-requirements/acceptance-criteria/ac-03-03-boundary-submit-purchase-request.md) | ส่ง PR ที่ 200,000 | Boundary | อนุมัติ 2 ขั้น |
| [AC-03-04](../../design/01-requirements/acceptance-criteria/ac-03-04-boundary-submit-purchase-request.md) | ส่ง PR เกิน 200,000 | Boundary | อนุมัติ 3 ขั้น (เพิ่ม `COMMITTEE`) |
| [AC-04-01](../../design/01-requirements/acceptance-criteria/ac-04-01-security-decide-approval.md) | ผู้ขอซื้ออนุมัติ PR ตนเอง | Security | 403 `ERR-SOD-001` |
| [AC-04-03](../../design/01-requirements/acceptance-criteria/ac-04-03-positive-decide-approval.md) | อนุมัติครบทุกขั้น | Positive | PR เป็น `APPROVED` มี audit ครบทุกขั้น |
| [AC-08-05](../../design/01-requirements/acceptance-criteria/ac-08-05-positive-decide-approval.md) | อนุมัติผลเลือกวงเงินเกิน 200,000 | Positive | RFQ เป็น `AWARDED` (BR-05) |
| [AC-13-01](../../design/01-requirements/acceptance-criteria/ac-13-01-positive-list-audit-logs.md) | ตรวจ audit ของ PR | Positive | เห็นเหตุการณ์ครบเรียงตามเวลา |
<!-- /generated -->

## Dependency / Assumption

- `PRC-S1`
- `PRC-S2`

- ประมาณการ story point เป็นค่าตั้งต้นที่ AI เสนอ ทีมต้องปรับเทียบ (planning poker) ก่อนใช้วางรอบ

## Out of Scope

- หน้าจออนุมัติ (อยู่ที่ PRC-03)

## Source Refs

<!-- generated:refs -->
| Ref | ชนิด | ชื่อ |
|---|---|---|
| [JNY-01](../../design/02-bu-process/journeys/jny-01-request-and-approval.md) | Journey | ขอซื้อและอนุมัติ |
| [FR-04](../../design/01-requirements/functional/fr-04-approval-chain.md) | ข้อกำหนดเชิงหน้าที่ | อนุมัติหรือปฏิเสธตามสายอนุมัติ |
| [FR-13](../../design/01-requirements/functional/fr-13-audit-trail.md) | ข้อกำหนดเชิงหน้าที่ | บันทึก audit trail |
| [BR-03](../../design/01-requirements/business-rules/br-03-approval-chain-by-amount.md) | กฎธุรกิจ | สายอนุมัติตามวงเงิน |
| [BR-04](../../design/01-requirements/business-rules/br-04-no-self-approval.md) | กฎธุรกิจ | ห้ามอนุมัติเอกสารของตนเอง |
| [BR-05](../../design/01-requirements/business-rules/br-05-award-approval-by-amount.md) | กฎธุรกิจ | อนุมัติผลเลือกผู้ชนะตามวงเงิน |
<!-- /generated -->

## Implementation Touchpoints

<!-- generated:touchpoints -->
ไม่มี API operation ในการ์ดนี้

ตารางข้อมูลที่เกี่ยวข้อง: `app_user`, `approval`, `audit_log`, `department`
<!-- /generated -->

## Change History

| รุ่น | รายละเอียด |
|---|---|
| 1.0 | ร่างแรกจาก design pieces ผ่านการตรวจ gate โดยสคริปต์ รอทีมตรวจรับ |
