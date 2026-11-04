---
code: PRC-02
module: PRC
card_type: screen
journey: JNY-01
journey_phase: 2
screen_ref: SCR-02
supports_journeys: []
status: draft
sprint: 1
priority: must
estimate:
  dev: 8
  qa: 5
depends_on:
- PRC-S1
- PRC-S2
- PRC-01
acceptance_refs:
- AC-01-01
- AC-01-02
- AC-01-03
- AC-01-04
- AC-03-01
- AC-03-02
- AC-03-03
- AC-03-04
- AC-03-05
- AC-03-06
- AC-03-07
- AC-14-01
- AC-02-03
- AC-02-04
source_refs:
- JNY-01
- UC-01
- UC-02
- FR-01
- FR-03
- BR-12
- SCR-02
- WF-02
owned_touchpoints:
- createPurchaseRequest
- getPurchaseRequest
- updatePurchaseRequest
- submitPurchaseRequest
consumed_touchpoints: []
tables:
- pr_item
- purchase_request
slicing_reason: หนึ่งหน้าจอ หนึ่งการ์ด ฟอร์มนี้เป็นเจ้าของ API ฝั่งเขียนของ PR
---

# PRC-02 — แบบฟอร์มใบขอซื้อ

## Value

ผู้ขอซื้อสร้าง แก้ไข และส่งใบขอซื้อเพื่ออนุมัติ เห็นสายอนุมัติที่จะเกิดก่อนส่ง และไม่เขียนทับกันเมื่อมีผู้แก้พร้อมกัน

## Scope

- หน้าจอ แบบฟอร์มใบขอซื้อ (SCR-02) ตามข้อกำหนดหน้าจอ
- คำนวณวงเงินรวมทันทีขณะกรอก และแสดงสายอนุมัติตาม BR-03
- จัดการ conflict เมื่อ `ERR-CONC-001` ด้วยการโหลดข้อมูลล่าสุด
- เรียก API: createPurchaseRequest, getPurchaseRequest, updatePurchaseRequest, submitPurchaseRequest

## Acceptance Criteria

<!-- generated:ac -->
| Ref | เกณฑ์ตรวจรับ | ประเภท | ผลที่คาดหวัง |
|---|---|---|---|
| [AC-01-01](../../design/01-requirements/acceptance-criteria/ac-01-01-positive-create-purchase-request.md) | สร้าง PR ถูกต้อง | Positive | 201, `prNo` รูปแบบ `PR-YYYY-NNNNN`, status `DRAFT`, `totalEstimated` = ผลรวม |
| [AC-01-02](../../design/01-requirements/acceptance-criteria/ac-01-02-negative-create-purchase-request.md) | สร้าง PR ไม่มีรายการ | Negative | 422 `ERR-VAL-001` |
| [AC-01-03](../../design/01-requirements/acceptance-criteria/ac-01-03-negative-create-purchase-request.md) | จำนวนเป็นศูนย์ | Negative | 422 `ERR-VAL-001` ที่ `items[0].quantity` |
| [AC-01-04](../../design/01-requirements/acceptance-criteria/ac-01-04-negative-update-purchase-request.md) | แก้ draft ด้วยเวอร์ชันล้าสมัย | Negative | B ได้ 409 `ERR-CONC-001` |
| [AC-03-01](../../design/01-requirements/acceptance-criteria/ac-03-01-boundary-submit-purchase-request.md) | ส่ง PR ไม่เกิน 20,000 | Boundary | สร้างอนุมัติ 1 ขั้น (`DEPT_APPROVER`) |
| [AC-03-02](../../design/01-requirements/acceptance-criteria/ac-03-02-boundary-submit-purchase-request.md) | ส่ง PR เกิน 20,000 หนึ่งสตางค์ | Boundary | สร้างอนุมัติ 2 ขั้น (`DEPT_APPROVER`, `PROCUREMENT_HEAD`) |
| [AC-03-03](../../design/01-requirements/acceptance-criteria/ac-03-03-boundary-submit-purchase-request.md) | ส่ง PR ที่ 200,000 | Boundary | อนุมัติ 2 ขั้น |
| [AC-03-04](../../design/01-requirements/acceptance-criteria/ac-03-04-boundary-submit-purchase-request.md) | ส่ง PR เกิน 200,000 | Boundary | อนุมัติ 3 ขั้น (เพิ่ม `COMMITTEE`) |
| [AC-03-05](../../design/01-requirements/acceptance-criteria/ac-03-05-idempotency-submit-purchase-request.md) | ส่งซ้ำด้วย Idempotency-Key เดิม | Idempotency | ได้ผลเดิม สร้างอนุมัติและ audit ชุดเดียว |
| [AC-03-06](../../design/01-requirements/acceptance-criteria/ac-03-06-negative-submit-purchase-request.md) | ส่ง PR ที่ไม่ใช่ draft | Negative | 409 `ERR-STATE-001` |
| [AC-03-07](../../design/01-requirements/acceptance-criteria/ac-03-07-resilience-submit-purchase-request.md) | ส่งซ้ำหลังแคช Idempotency หาย | Resilience | 409 `ERR-STATE-001` ไม่สร้างแถวอนุมัติและ audit ซ้ำ (กฎสถานะของเอกสารเป็นด่านที่สอง ตาม ADR-04) |
| [AC-14-01](../../design/01-requirements/acceptance-criteria/ac-14-01-concurrency-create-purchase-request.md) | ออกเลขเอกสารพร้อมกัน | Concurrency | เลข 1,000 ค่าไม่ซ้ำ ต่อเนื่อง (NFR-04) |
| [AC-02-03](../../design/01-requirements/acceptance-criteria/ac-02-03-positive-get-purchase-request.md) | ดูรายละเอียด PR พร้อมสายอนุมัติ | Positive | 200 มี `items` ครบและ `approvals` 2 ขั้นตามลำดับ |
| [AC-02-04](../../design/01-requirements/acceptance-criteria/ac-02-04-security-get-purchase-request.md) | ดู PR ของหน่วยงานอื่น | Security | 404 `ERR-NF-001` (ไม่บอกว่าเอกสารมีอยู่) |
<!-- /generated -->

## Dependency / Assumption

- `PRC-S1`
- `PRC-S2`
- `PRC-01`

- ประมาณการ story point เป็นค่าตั้งต้นที่ AI เสนอ ทีมต้องปรับเทียบ (planning poker) ก่อนใช้วางรอบ

## Out of Scope

- การตัดสินใจอนุมัติ (PRC-03)

## Source Refs

<!-- generated:refs -->
| Ref | ชนิด | ชื่อ |
|---|---|---|
| [JNY-01](../../design/02-bu-process/journeys/jny-01-request-and-approval.md) | Journey | ขอซื้อและอนุมัติ |
| [UC-01](../../design/02-bu-process/usecases/uc-01-create-edit-pr.md) | Use Case | สร้างและแก้ไขใบขอซื้อ |
| [UC-02](../../design/02-bu-process/usecases/uc-02-submit-pr.md) | Use Case | ส่งใบขอซื้อเพื่ออนุมัติ |
| [FR-01](../../design/01-requirements/functional/fr-01-draft-pr.md) | ข้อกำหนดเชิงหน้าที่ | สร้างและแก้ไขใบขอซื้อ |
| [FR-03](../../design/01-requirements/functional/fr-03-submit-pr.md) | ข้อกำหนดเชิงหน้าที่ | ส่งใบขอซื้อเพื่ออนุมัติ |
| [BR-12](../../design/01-requirements/business-rules/br-12-approved-doc-immutable.md) | กฎธุรกิจ | เอกสารที่อนุมัติแล้วแก้ไม่ได้ |
| [SCR-02](../../design/05-ui-desc/screens/scr-02-pr-form.md) | หน้าจอ | แบบฟอร์มใบขอซื้อ |
| [WF-02](../../design/05-ui-desc/wireframes/wf-02-pr-form.md) | Wireframe | Wireframe SCR-02 แบบฟอร์มใบขอซื้อ |
<!-- /generated -->

## Implementation Touchpoints

<!-- generated:touchpoints -->
| operationId | Method Path | การเป็นเจ้าของ |
|---|---|---|
| `createPurchaseRequest` | POST `/purchase-requests` | เป็นเจ้าของ |
| `getPurchaseRequest` | GET `/purchase-requests/{prId}` | เป็นเจ้าของ |
| `updatePurchaseRequest` | PUT `/purchase-requests/{prId}` | เป็นเจ้าของ |
| `submitPurchaseRequest` | POST `/purchase-requests/{prId}/submit` | เป็นเจ้าของ |

ตารางข้อมูลที่เกี่ยวข้อง: `pr_item`, `purchase_request`
<!-- /generated -->

## Change History

| รุ่น | รายละเอียด |
|---|---|
| 1.0 | ร่างแรกจาก design pieces ผ่านการตรวจ gate โดยสคริปต์ รอทีมตรวจรับ |
