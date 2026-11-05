---
code: PRC-01
module: PRC
card_type: screen
journey: JNY-01
journey_phase: 1
screen_ref: SCR-01
supports_journeys: []
status: draft
sprint: 1
priority: must
estimate:
  dev: 3
  qa: 2
depends_on:
- PRC-S1
- PRC-S2
acceptance_refs:
- AC-02-01
- AC-02-02
- AC-02-05
source_refs:
- JNY-01
- UC-01
- FR-02
- SCR-01
- WF-01
owned_touchpoints:
- listPurchaseRequests
consumed_touchpoints: []
tables:
- app_user
- department
- purchase_request
slicing_reason: หนึ่งหน้าจอ หนึ่งการ์ด
---

# PRC-01 — รายการใบขอซื้อ

## Value

ผู้ใช้ค้นหาและดูรายการใบขอซื้อตามสิทธิ์ของตน กรองตามสถานะและช่วงวันที่ได้

## Scope

- หน้าจอ รายการใบขอซื้อ (SCR-01) ตามข้อกำหนดหน้าจอ
- แสดงเฉพาะ PR ของตน หรือของหน่วยงานตามบทบาท
- กรองตามสถานะ ช่วงวันที่ ใช้ keyset pagination
- เรียก API: listPurchaseRequests

## Acceptance Criteria

<!-- generated:ac -->
| Ref | เกณฑ์ตรวจรับ | ประเภท | ผลที่คาดหวัง |
|---|---|---|---|
| [AC-02-01](../../design/01-requirements/acceptance-criteria/ac-02-01-security-list-purchase-requests.md) | ผู้ขอซื้อเห็นเฉพาะ PR ของตน | Security | ผลไม่มี PR ของ B |
| [AC-02-02](../../design/01-requirements/acceptance-criteria/ac-02-02-security-list-purchase-requests.md) | token หมดอายุ | Security | 401 `ERR-AUTH-001` |
| [AC-02-05](../../design/01-requirements/acceptance-criteria/ac-02-05-security-list-purchase-requests.md) | ผู้รับของหา PO ที่ต้องรับ | Security | ผลมีเฉพาะ PR ที่มี PO สถานะ `ISSUED`, `PARTIALLY_RECEIVED` หรือ `RECEIVED` |
<!-- /generated -->

## Dependency / Assumption

- `PRC-S1`
- `PRC-S2`

- ประมาณการ story point เป็นค่าตั้งต้นที่ AI เสนอ ทีมต้องปรับเทียบ (planning poker) ก่อนใช้วางรอบ

## Out of Scope

- แบบฟอร์มสร้างและแก้ไข (PRC-02)

## Source Refs

<!-- generated:refs -->
| Ref | ชนิด | ชื่อ |
|---|---|---|
| [JNY-01](../../design/02-bu-process/journeys/jny-01-request-and-approval.md) | Journey | ขอซื้อและอนุมัติ |
| [UC-01](../../design/02-bu-process/usecases/uc-01-create-edit-pr.md) | Use Case | สร้างและแก้ไขใบขอซื้อ |
| [FR-02](../../design/01-requirements/functional/fr-02-search-pr.md) | ข้อกำหนดเชิงหน้าที่ | ค้นหาและดูรายการใบขอซื้อ |
| [SCR-01](../../design/05-ui-desc/screens/scr-01-pr-list.md) | หน้าจอ | รายการใบขอซื้อ |
| [WF-01](../../design/05-ui-desc/wireframes/wf-01-pr-list.md) | Wireframe | Wireframe SCR-01 รายการใบขอซื้อ |
<!-- /generated -->

## Implementation Touchpoints

<!-- generated:touchpoints -->
| operationId | Method Path | การเป็นเจ้าของ |
|---|---|---|
| `listPurchaseRequests` | GET `/purchase-requests` | เป็นเจ้าของ |

ตารางข้อมูลที่เกี่ยวข้อง: `app_user`, `department`, `purchase_request`
<!-- /generated -->

## Change History

| รุ่น | รายละเอียด |
|---|---|
| 1.0 | ร่างแรกจาก design pieces ผ่านการตรวจ gate โดยสคริปต์ รอทีมตรวจรับ |
