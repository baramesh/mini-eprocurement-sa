---
code: PRC-03
module: PRC
card_type: screen
journey: JNY-01
journey_phase: 3
screen_ref: SCR-03
supports_journeys:
- JNY-02
status: draft
sprint: 1
priority: must
estimate:
  dev: 5
  qa: 3
depends_on:
- PRC-02
- PRC-S3
acceptance_refs:
- TC-12
- TC-13
- TC-14
- TC-15
- TC-16
- TC-30
source_refs:
- JNY-01
- UC-03
- UC-05
- FR-04
- FR-08
- BR-02
- BR-03
- BR-04
- BR-05
- BR-06
- BR-12
- SCR-03
owned_touchpoints:
- listMyApprovals
- decideApproval
consumed_touchpoints: []
tables:
- app_user
- approval
- award
- department
slicing_reason: หน้าจอที่สองจาก Journey ใช้ร่วมกับ JNY-02 (ผลเลือกผู้ชนะ) จึงมีการ์ดเดียวและระบุ `supports_journeys`
---

# PRC-03 — กล่องอนุมัติ

## Value

ผู้อนุมัติเห็นเฉพาะงานที่ถึงขั้นของตน และอนุมัติหรือปฏิเสธได้ทั้งใบขอซื้อและผลเลือกผู้ชนะ

## Scope

- หน้าจอ กล่องอนุมัติ (SCR-03) ตามข้อกำหนดหน้าจอ
- กล่องอนุมัติเรียงเก่าสุดก่อน
- ซ่อนปุ่มตัดสินเมื่อผู้ใช้คือผู้ขอซื้อ
- เรียก API: listMyApprovals, decideApproval

## Acceptance Criteria

<!-- generated:ac -->
| Ref | กรณีทดสอบ | ประเภท | ผลที่คาดหวัง |
|---|---|---|---|
| [TC-12](../../design/09-qa-and-test/cases/tc-12-security-decide-approval.md) | ผู้ขอซื้ออนุมัติ PR ตนเอง | Security | 403 `ERR-SOD-001` |
| [TC-13](../../design/09-qa-and-test/cases/tc-13-negative-decide-approval.md) | ปฏิเสธโดยไม่ระบุเหตุผล | Negative | 422 `ERR-VAL-001` |
| [TC-14](../../design/09-qa-and-test/cases/tc-14-positive-decide-approval.md) | อนุมัติครบทุกขั้น | Positive | PR เป็น `APPROVED` มี audit ครบทุกขั้น |
| [TC-15](../../design/09-qa-and-test/cases/tc-15-positive-decide-approval.md) | ปฏิเสธแล้วกลับ draft | Positive | PR เป็น `DRAFT` แก้ไขได้ |
| [TC-16](../../design/09-qa-and-test/cases/tc-16-security-list-my-approvals.md) | กล่องอนุมัติแสดงเฉพาะขั้นของตน | Security | ไม่เห็น PR นั้น |
| [TC-30](../../design/09-qa-and-test/cases/tc-30-positive-decide-approval.md) | อนุมัติผลเลือกวงเงินเกิน 200,000 | Positive | RFQ เป็น `AWARDED` (BR-05) |
<!-- /generated -->

## Dependency / Assumption

- `PRC-02`
- `PRC-S3`

- ประมาณการ story point เป็นค่าตั้งต้นที่ AI เสนอ ทีมต้องปรับเทียบ (planning poker) ก่อนใช้วางรอบ

## Out of Scope

- ตรรกะสร้างสายอนุมัติ (PRC-S3)

## Source Refs

<!-- generated:refs -->
| Ref | ชนิด | ชื่อ |
|---|---|---|
| [JNY-01](../../design/02-bu-process/journeys/jny-01-request-and-approval.md) | Journey | ขอซื้อและอนุมัติ |
| [UC-03](../../design/02-bu-process/usecases/uc-03-decide-approval.md) | Use Case | อนุมัติหรือปฏิเสธใบขอซื้อ |
| [UC-05](../../design/02-bu-process/usecases/uc-05-compare-and-award.md) | Use Case | เปรียบเทียบราคาและเลือกผู้ชนะ |
| [FR-04](../../design/01-requirements/functional/fr-04-approval-chain.md) | ข้อกำหนดเชิงหน้าที่ | อนุมัติหรือปฏิเสธตามสายอนุมัติ |
| [FR-08](../../design/01-requirements/functional/fr-08-award-with-reason.md) | ข้อกำหนดเชิงหน้าที่ | เลือกผู้ชนะพร้อมเหตุผล |
| [BR-02](../../design/01-requirements/business-rules/br-02-rfq-min-vendors.md) | กฎธุรกิจ | RFQ เชิญผู้ขายอย่างน้อย 3 ราย |
| [BR-03](../../design/01-requirements/business-rules/br-03-approval-chain-by-amount.md) | กฎธุรกิจ | สายอนุมัติตามวงเงิน |
| [BR-04](../../design/01-requirements/business-rules/br-04-no-self-approval.md) | กฎธุรกิจ | ห้ามอนุมัติเอกสารของตนเอง |
| [BR-05](../../design/01-requirements/business-rules/br-05-award-approval-by-amount.md) | กฎธุรกิจ | อนุมัติผลเลือกผู้ชนะตามวงเงิน |
| [BR-06](../../design/01-requirements/business-rules/br-06-non-lowest-reason.md) | กฎธุรกิจ | เหตุผลเมื่อไม่เลือกราคาต่ำสุด |
| [BR-12](../../design/01-requirements/business-rules/br-12-approved-doc-immutable.md) | กฎธุรกิจ | เอกสารที่อนุมัติแล้วแก้ไม่ได้ |
| [SCR-03](../../design/05-ui-desc/screens/scr-03-approval-inbox.md) | หน้าจอ | กล่องอนุมัติ |
<!-- /generated -->

## Implementation Touchpoints

<!-- generated:touchpoints -->
| operationId | Method Path | การเป็นเจ้าของ |
|---|---|---|
| `listMyApprovals` | GET `/approvals` | เป็นเจ้าของ |
| `decideApproval` | POST `/approvals/{approvalId}/decision` | เป็นเจ้าของ |

ตารางข้อมูลที่เกี่ยวข้อง: `app_user`, `approval`, `award`, `department`
<!-- /generated -->

## Change History

| รุ่น | รายละเอียด |
|---|---|
| 1.0 | ร่างแรกจาก design pieces ผ่านการตรวจ gate โดยสคริปต์ รอทีมตรวจรับ |
