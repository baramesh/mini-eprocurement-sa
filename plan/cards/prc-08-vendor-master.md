---
code: PRC-08
module: PRC
card_type: screen
journey: JNY-02
journey_phase: 1
screen_ref: SCR-08
supports_journeys: []
status: draft
sprint: 2
priority: must
estimate:
  dev: 3
  qa: 2
depends_on:
- PRC-S1
- PRC-S2
acceptance_refs:
- TC-40
- TC-41
- TC-42
- TC-43
source_refs:
- JNY-02
- UC-08
- FR-11
- BR-11
- SCR-08
owned_touchpoints:
- listVendors
- createVendor
- setVendorStatus
consumed_touchpoints: []
tables:
- vendor
slicing_reason: เป็นข้อมูลตั้งต้นที่ RFQ ต้องใช้ จึงเป็น phase แรกของ JNY-02
---

# PRC-08 — ทะเบียนผู้ขาย

## Value

เจ้าหน้าที่จัดซื้อค้นหา เพิ่ม และระงับผู้ขาย โดยเลขผู้เสียภาษีไม่ซ้ำและผู้ขายที่ถูกระงับถูกใช้ไม่ได้

## Scope

- หน้าจอ ทะเบียนผู้ขาย (SCR-08) ตามข้อกำหนดหน้าจอ
- ค้นหาตามชื่อหรือเลขผู้เสียภาษี
- หัวหน้าจัดซื้อระงับหรือเปิดใช้พร้อมเหตุผล
- เรียก API: listVendors, createVendor, setVendorStatus

## Acceptance Criteria

<!-- generated:ac -->
| Ref | กรณีทดสอบ | ประเภท | ผลที่คาดหวัง |
|---|---|---|---|
| [TC-40](../../design/09-qa-and-test/cases/tc-40-negative-create-vendor.md) | เพิ่มผู้ขายเลขภาษีซ้ำ | Negative | 409 `ERR-VND-001` |
| [TC-41](../../design/09-qa-and-test/cases/tc-41-negative-create-vendor.md) | เลขภาษีไม่ครบ 13 หลัก | Negative | 422 `ERR-VAL-001` |
| [TC-42](../../design/09-qa-and-test/cases/tc-42-positive-set-vendor-status.md) | ระงับผู้ขาย | Positive | 200 มี audit |
| [TC-43](../../design/09-qa-and-test/cases/tc-43-positive-list-vendors.md) | ค้นหาผู้ขายตามชื่อ | Positive | ได้เฉพาะผู้ขายที่ตรง |
<!-- /generated -->

## Dependency / Assumption

- `PRC-S1`
- `PRC-S2`

- ประมาณการ story point เป็นค่าตั้งต้นที่ AI เสนอ ทีมต้องปรับเทียบ (planning poker) ก่อนใช้วางรอบ

## Out of Scope

- การที่ผู้ขายล็อกอินเอง

## Source Refs

<!-- generated:refs -->
| Ref | ชนิด | ชื่อ |
|---|---|---|
| [JNY-02](../../design/02-bu-process/journeys/jny-02-sourcing-and-award.md) | Journey | จัดหาและเลือกผู้ชนะ |
| [UC-08](../../design/02-bu-process/usecases/uc-08-vendor-master.md) | Use Case | จัดการทะเบียนผู้ขาย |
| [FR-11](../../design/01-requirements/functional/fr-11-vendor-master.md) | ข้อกำหนดเชิงหน้าที่ | จัดการทะเบียนผู้ขาย |
| [BR-11](../../design/01-requirements/business-rules/br-11-suspended-vendor.md) | กฎธุรกิจ | ผู้ขายถูกระงับ |
| [SCR-08](../../design/05-ui-desc/screens/scr-08-vendor-master.md) | หน้าจอ | ทะเบียนผู้ขาย |
<!-- /generated -->

## Implementation Touchpoints

<!-- generated:touchpoints -->
| operationId | Method Path | การเป็นเจ้าของ |
|---|---|---|
| `listVendors` | GET `/vendors` | เป็นเจ้าของ |
| `createVendor` | POST `/vendors` | เป็นเจ้าของ |
| `setVendorStatus` | PUT `/vendors/{vendorId}/status` | เป็นเจ้าของ |

ตารางข้อมูลที่เกี่ยวข้อง: `vendor`
<!-- /generated -->

## Change History

| รุ่น | รายละเอียด |
|---|---|
| 1.0 | ร่างแรกจาก design pieces ผ่านการตรวจ gate โดยสคริปต์ รอทีมตรวจรับ |
