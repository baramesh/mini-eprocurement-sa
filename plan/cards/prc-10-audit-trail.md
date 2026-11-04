---
code: PRC-10
module: PRC
card_type: screen
journey: JNY-04
journey_phase: 2
screen_ref: SCR-10
supports_journeys: []
status: draft
sprint: 4
priority: should
estimate:
  dev: 2
  qa: 2
depends_on:
- PRC-S3
acceptance_refs:
- AC-13-01
- AC-13-02
source_refs:
- JNY-04
- UC-10
- FR-13
- SCR-10
- WF-10
owned_touchpoints:
- listAuditLogs
consumed_touchpoints: []
tables:
- audit_log
slicing_reason: หนึ่งหน้าจอ หนึ่งการ์ด
---

# PRC-10 — Audit trail

## Value

ผู้ดูแลระบบตรวจประวัติเหตุการณ์ของเอกสารหนึ่งใบเรียงตามเวลา

## Scope

- หน้าจอ Audit trail (SCR-10) ตามข้อกำหนดหน้าจอ
- ค้นตามชนิดและรหัสเอกสาร
- เรียก API: listAuditLogs

## Acceptance Criteria

<!-- generated:ac -->
| Ref | เกณฑ์ตรวจรับ | ประเภท | ผลที่คาดหวัง |
|---|---|---|---|
| [AC-13-01](../../design/01-requirements/acceptance-criteria/ac-13-01-positive-list-audit-logs.md) | ตรวจ audit ของ PR | Positive | ประวัติของ PR มี `SUBMIT` แล้ว `APPROVE` ทุกขั้นเรียงตามเวลา และประวัติของ RFQ ที่สร้างจาก PR นั้นมี `CREATE` |
| [AC-13-02](../../design/01-requirements/acceptance-criteria/ac-13-02-security-list-audit-logs.md) | บัญชีแอปแก้ audit ไม่ได้ | Security | ถูกปฏิเสธโดยฐานข้อมูล (NFR-02) |
<!-- /generated -->

## Dependency / Assumption

- `PRC-S3`

- ประมาณการ story point เป็นค่าตั้งต้นที่ AI เสนอ ทีมต้องปรับเทียบ (planning poker) ก่อนใช้วางรอบ

## Out of Scope

- การแก้หรือลบ audit (ทำไม่ได้โดยออกแบบ)

## Source Refs

<!-- generated:refs -->
| Ref | ชนิด | ชื่อ |
|---|---|---|
| [JNY-04](../../design/02-bu-process/journeys/jny-04-report-and-audit.md) | Journey | รายงานและตรวจสอบ |
| [UC-10](../../design/02-bu-process/usecases/uc-10-audit-trail.md) | Use Case | ตรวจ audit trail |
| [FR-13](../../design/01-requirements/functional/fr-13-audit-trail.md) | ข้อกำหนดเชิงหน้าที่ | บันทึก audit trail |
| [SCR-10](../../design/05-ui-desc/screens/scr-10-audit-trail.md) | หน้าจอ | Audit trail |
| [WF-10](../../design/05-ui-desc/wireframes/wf-10-audit-trail.md) | Wireframe | Wireframe SCR-10 Audit trail |
<!-- /generated -->

## Implementation Touchpoints

<!-- generated:touchpoints -->
| operationId | Method Path | การเป็นเจ้าของ |
|---|---|---|
| `listAuditLogs` | GET `/audit-logs` | เป็นเจ้าของ |

ตารางข้อมูลที่เกี่ยวข้อง: `audit_log`
<!-- /generated -->

## Change History

| รุ่น | รายละเอียด |
|---|---|
| 1.0 | ร่างแรกจาก design pieces ผ่านการตรวจ gate โดยสคริปต์ รอทีมตรวจรับ |
