---
code: PRC-S2
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
  qa: 5
depends_on:
- PRC-S1
acceptance_refs:
- AC-03-05
- AC-02-02
source_refs:
- JNY-01
- NFR-03
- NFR-05
owned_touchpoints: []
consumed_touchpoints: []
tables: []
slicing_reason: งานข้ามส่วนที่ทุก endpoint ใช้ ไม่ผูกกับหน้าจอใด
---

# PRC-S2 — โครงพื้นฐานของ API

## Value

โครงพื้นฐานของ API: ตรวจ token และบทบาท ขอบเขตข้อมูลตามหน่วยงาน รูปแบบข้อผิดพลาด Idempotency-Key และตรวจการแก้ไขซ้อนด้วย If-Match

## Scope

- ตรวจ JWT และบทบาทตาม `x-roles` ของแต่ละ operation
- รูปแบบข้อผิดพลาดและรหัส `ERR-*` ตามข้อกำหนด API
- Idempotency-Key เก็บผล 24 ชั่วโมง และ If-Match กับ `row_version`

## Acceptance Criteria

<!-- generated:ac -->
| Ref | เกณฑ์ตรวจรับ | ประเภท | ผลที่คาดหวัง |
|---|---|---|---|
| [AC-03-05](../../design/01-requirements/acceptance-criteria/ac-03-05-idempotency-submit-purchase-request.md) | ส่งซ้ำด้วย Idempotency-Key เดิม | Idempotency | ได้ผลเดิม สร้างอนุมัติและ audit ชุดเดียว |
| [AC-02-02](../../design/01-requirements/acceptance-criteria/ac-02-02-security-list-purchase-requests.md) | token หมดอายุ | Security | 401 `ERR-AUTH-001` |
<!-- /generated -->

## Dependency / Assumption

- `PRC-S1`

- ประมาณการ story point เป็นค่าตั้งต้นที่ AI เสนอ ทีมต้องปรับเทียบ (planning poker) ก่อนใช้วางรอบ

## Out of Scope

- การยืนยันตัวตนกับ SSO (นอกขอบเขตโจทย์นี้)

## Source Refs

<!-- generated:refs -->
| Ref | ชนิด | ชื่อ |
|---|---|---|
| [JNY-01](../../design/02-bu-process/journeys/jny-01-request-and-approval.md) | Journey | ขอซื้อและอนุมัติ |
| [NFR-03](../../design/01-requirements/nfr/nfr-03-security.md) | ข้อกำหนดที่ไม่ใช่เชิงหน้าที่ | ความปลอดภัย |
| [NFR-05](../../design/01-requirements/nfr/nfr-05-idempotent-commands.md) | ข้อกำหนดที่ไม่ใช่เชิงหน้าที่ | การเรียกซ้ำปลอดภัย |
<!-- /generated -->

## Implementation Touchpoints

<!-- generated:touchpoints -->
ไม่มี API operation ในการ์ดนี้

ตารางข้อมูลที่เกี่ยวข้อง: –
<!-- /generated -->

## Change History

| รุ่น | รายละเอียด |
|---|---|
| 1.0 | ร่างแรกจาก design pieces ผ่านการตรวจ gate โดยสคริปต์ รอทีมตรวจรับ |
