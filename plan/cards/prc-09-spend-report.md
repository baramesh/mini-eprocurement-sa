---
code: PRC-09
module: PRC
card_type: screen
journey: JNY-04
journey_phase: 1
screen_ref: SCR-09
supports_journeys: []
status: draft
sprint: 4
priority: should
estimate:
  dev: 5
  qa: 3
depends_on:
- PRC-06
- PRC-07
acceptance_refs:
- AC-12-01
- AC-12-02
source_refs:
- JNY-04
- UC-09
- FR-12
- SCR-09
- WF-09
owned_touchpoints:
- getSpendSummary
consumed_touchpoints: []
tables: []
slicing_reason: หนึ่งหน้าจอ หนึ่งการ์ด
---

# PRC-09 — รายงานสรุปการจัดซื้อ

## Value

ผู้บริหารดูรายงานสรุปการจัดซื้อตามช่วงเวลา หน่วยงาน หรือผู้ขาย พร้อมส่วนต่างจากราคาประมาณการ

## Scope

- หน้าจอ รายงานสรุปการจัดซื้อ (SCR-09) ตามข้อกำหนดหน้าจอ
- จัดกลุ่มตามหน่วยงาน ผู้ขาย หรือเดือน
- เรียก API: getSpendSummary

## Acceptance Criteria

<!-- generated:ac -->
| Ref | เกณฑ์ตรวจรับ | ประเภท | ผลที่คาดหวัง |
|---|---|---|---|
| [AC-12-01](../../design/01-requirements/acceptance-criteria/ac-12-01-positive-get-spend-summary.md) | รายงานสรุปแยกหน่วยงาน | Positive | ผลรวมตรงกับข้อมูลต้นทาง `savingVsEstimate` = ประมาณการ − สั่งจริง |
| [AC-12-02](../../design/01-requirements/acceptance-criteria/ac-12-02-security-get-spend-summary.md) | ผู้ขอซื้อเรียกรายงาน | Security | 403 `ERR-AUTH-002` |
<!-- /generated -->

## Dependency / Assumption

- `PRC-06`
- `PRC-07`

- ประมาณการ story point เป็นค่าตั้งต้นที่ AI เสนอ ทีมต้องปรับเทียบ (planning poker) ก่อนใช้วางรอบ

## Out of Scope

- การส่งออกรายงานเป็นไฟล์

## Source Refs

<!-- generated:refs -->
| Ref | ชนิด | ชื่อ |
|---|---|---|
| [JNY-04](../../design/02-bu-process/journeys/jny-04-report-and-audit.md) | Journey | รายงานและตรวจสอบ |
| [UC-09](../../design/02-bu-process/usecases/uc-09-spend-report.md) | Use Case | ดูรายงานสรุปการจัดซื้อ |
| [FR-12](../../design/01-requirements/functional/fr-12-spend-report.md) | ข้อกำหนดเชิงหน้าที่ | รายงานสรุปการจัดซื้อ |
| [SCR-09](../../design/05-ui-desc/screens/scr-09-spend-report.md) | หน้าจอ | รายงานสรุปการจัดซื้อ |
| [WF-09](../../design/05-ui-desc/wireframes/wf-09-spend-report.md) | Wireframe | Wireframe SCR-09 รายงานสรุปการจัดซื้อ |
<!-- /generated -->

## Implementation Touchpoints

<!-- generated:touchpoints -->
| operationId | Method Path | การเป็นเจ้าของ |
|---|---|---|
| `getSpendSummary` | GET `/reports/spend-summary` | เป็นเจ้าของ |

ตารางข้อมูลที่เกี่ยวข้อง: –
<!-- /generated -->

## Change History

| รุ่น | รายละเอียด |
|---|---|
| 1.0 | ร่างแรกจาก design pieces ผ่านการตรวจ gate โดยสคริปต์ รอทีมตรวจรับ |
