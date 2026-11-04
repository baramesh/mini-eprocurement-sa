---
code: PRC-05
module: PRC
card_type: screen
journey: JNY-02
journey_phase: 3
screen_ref: SCR-05
supports_journeys: []
status: draft
sprint: 2
priority: must
estimate:
  dev: 8
  qa: 5
depends_on:
- PRC-04
- PRC-S3
acceptance_refs:
- AC-06-01
- AC-06-02
- AC-06-03
- AC-07-01
- AC-08-01
- AC-08-02
- AC-08-03
- AC-08-04
source_refs:
- JNY-02
- UC-04
- UC-05
- FR-06
- FR-07
- FR-08
- BR-02
- BR-04
- BR-05
- BR-06
- BR-07
- BR-08
- SCR-05
- WF-05
owned_touchpoints:
- recordQuotation
- getQuotationComparison
- awardRfq
consumed_touchpoints: []
tables:
- approval
- award
- quotation
- quotation_item
slicing_reason: หน้าจอเดียวที่รวมการบันทึก เปรียบเทียบ และเสนอผล เพราะแยกส่งมอบไม่ได้
---

# PRC-05 — บันทึกและเปรียบเทียบใบเสนอราคา

## Value

เจ้าหน้าที่บันทึกใบเสนอราคา ดูตารางเปรียบเทียบ และเสนอผลเลือกผู้ชนะพร้อมเหตุผลเมื่อไม่ใช่ราคาต่ำสุด

## Scope

- หน้าจอ บันทึกและเปรียบเทียบใบเสนอราคา (SCR-05) ตามข้อกำหนดหน้าจอ
- ตารางเปรียบเทียบที่ไฮไลต์ราคารวมต่ำสุด
- เหตุผลบังคับอย่างน้อย 20 ตัวอักษรเมื่อไม่เลือกต่ำสุด
- เรียก API: recordQuotation, getQuotationComparison, awardRfq

## Acceptance Criteria

<!-- generated:ac -->
| Ref | เกณฑ์ตรวจรับ | ประเภท | ผลที่คาดหวัง |
|---|---|---|---|
| [AC-06-01](../../design/01-requirements/acceptance-criteria/ac-06-01-negative-record-quotation.md) | บันทึกใบเสนอราคาจากผู้ขายที่ไม่ได้รับเชิญ | Negative | 422 `ERR-RFQ-002` |
| [AC-06-02](../../design/01-requirements/acceptance-criteria/ac-06-02-negative-record-quotation.md) | บันทึกใบเสนอราคาหลังปิดรับ | Negative | 409 `ERR-RFQ-003` |
| [AC-06-03](../../design/01-requirements/acceptance-criteria/ac-06-03-positive-record-quotation.md) | บันทึกใบเสนอราคาซ้ำ | Positive | ฉบับแรก `isActive` = false ฉบับหลัง true เหลือฉบับที่ใช้งาน 1 ฉบับ |
| [AC-07-01](../../design/01-requirements/acceptance-criteria/ac-07-01-positive-get-quotation-comparison.md) | ตารางเทียบราคาระบุรายต่ำสุด | Positive | `lowestQuotationId` ชี้ใบ 90 |
| [AC-08-01](../../design/01-requirements/acceptance-criteria/ac-08-01-negative-award-rfq.md) | เสนอผลโดยมีใบเสนอราคารายเดียว | Negative | 422 `ERR-RFQ-005` |
| [AC-08-02](../../design/01-requirements/acceptance-criteria/ac-08-02-negative-award-rfq.md) | เลือกไม่ใช่ราคาต่ำสุด ไม่มีเหตุผล | Negative | 422 `ERR-RFQ-004` |
| [AC-08-03](../../design/01-requirements/acceptance-criteria/ac-08-03-boundary-award-rfq.md) | เลือกไม่ใช่ต่ำสุด เหตุผล 19 ตัวอักษร | Boundary | 422 `ERR-RFQ-004` |
| [AC-08-04](../../design/01-requirements/acceptance-criteria/ac-08-04-boundary-award-rfq.md) | เลือกไม่ใช่ต่ำสุด เหตุผล 20 ตัวอักษร | Boundary | 202 RFQ เป็น `AWARD_PENDING` |
<!-- /generated -->

## Dependency / Assumption

- `PRC-04`
- `PRC-S3`

- ประมาณการ story point เป็นค่าตั้งต้นที่ AI เสนอ ทีมต้องปรับเทียบ (planning poker) ก่อนใช้วางรอบ

## Out of Scope

- การอนุมัติผลเลือก (PRC-03)

## Source Refs

<!-- generated:refs -->
| Ref | ชนิด | ชื่อ |
|---|---|---|
| [JNY-02](../../design/02-bu-process/journeys/jny-02-sourcing-and-award.md) | Journey | จัดหาและเลือกผู้ชนะ |
| [UC-04](../../design/02-bu-process/usecases/uc-04-rfq-and-quotation.md) | Use Case | ขอใบเสนอราคาและบันทึกใบเสนอราคา |
| [UC-05](../../design/02-bu-process/usecases/uc-05-compare-and-award.md) | Use Case | เปรียบเทียบราคาและเลือกผู้ชนะ |
| [FR-06](../../design/01-requirements/functional/fr-06-record-quotation.md) | ข้อกำหนดเชิงหน้าที่ | บันทึกใบเสนอราคา |
| [FR-07](../../design/01-requirements/functional/fr-07-compare-prices.md) | ข้อกำหนดเชิงหน้าที่ | เปรียบเทียบราคา |
| [FR-08](../../design/01-requirements/functional/fr-08-award-with-reason.md) | ข้อกำหนดเชิงหน้าที่ | เลือกผู้ชนะพร้อมเหตุผล |
| [BR-02](../../design/01-requirements/business-rules/br-02-rfq-min-vendors.md) | กฎธุรกิจ | RFQ เชิญผู้ขายอย่างน้อย 3 ราย |
| [BR-04](../../design/01-requirements/business-rules/br-04-no-self-approval.md) | กฎธุรกิจ | ห้ามอนุมัติเอกสารของตนเอง |
| [BR-05](../../design/01-requirements/business-rules/br-05-award-approval-by-amount.md) | กฎธุรกิจ | อนุมัติผลเลือกผู้ชนะตามวงเงิน |
| [BR-06](../../design/01-requirements/business-rules/br-06-non-lowest-reason.md) | กฎธุรกิจ | เหตุผลเมื่อไม่เลือกราคาต่ำสุด |
| [BR-07](../../design/01-requirements/business-rules/br-07-quotation-invited-only.md) | กฎธุรกิจ | รับใบเสนอราคาเฉพาะผู้ที่ได้รับเชิญ |
| [BR-08](../../design/01-requirements/business-rules/br-08-one-active-quotation.md) | กฎธุรกิจ | ใบเสนอราคาที่ใช้งานได้ฉบับเดียว |
| [SCR-05](../../design/05-ui-desc/screens/scr-05-quotation-compare.md) | หน้าจอ | บันทึกและเปรียบเทียบใบเสนอราคา |
| [WF-05](../../design/05-ui-desc/wireframes/wf-05-quotation-compare.md) | Wireframe | Wireframe SCR-05 บันทึกและเปรียบเทียบใบเสนอราคา |
<!-- /generated -->

## Implementation Touchpoints

<!-- generated:touchpoints -->
| operationId | Method Path | การเป็นเจ้าของ |
|---|---|---|
| `recordQuotation` | POST `/rfqs/{rfqId}/quotations` | เป็นเจ้าของ |
| `getQuotationComparison` | GET `/rfqs/{rfqId}/comparison` | เป็นเจ้าของ |
| `awardRfq` | POST `/rfqs/{rfqId}/award` | เป็นเจ้าของ |

ตารางข้อมูลที่เกี่ยวข้อง: `approval`, `award`, `quotation`, `quotation_item`
<!-- /generated -->

## Change History

| รุ่น | รายละเอียด |
|---|---|
| 1.0 | ร่างแรกจาก design pieces ผ่านการตรวจ gate โดยสคริปต์ รอทีมตรวจรับ |
