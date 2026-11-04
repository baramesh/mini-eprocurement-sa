---
code: PRC-07
module: PRC
card_type: screen
journey: JNY-03
journey_phase: 2
screen_ref: SCR-07
supports_journeys: []
status: draft
sprint: 3
priority: must
estimate:
  dev: 5
  qa: 3
depends_on:
- PRC-06
acceptance_refs:
- AC-10-01
- AC-10-02
- AC-10-03
- AC-10-04
source_refs:
- JNY-03
- UC-07
- FR-10
- BR-10
- SCR-07
- WF-07
owned_touchpoints:
- recordGoodsReceipt
consumed_touchpoints:
- getPurchaseOrder
tables:
- goods_receipt
- gr_item
slicing_reason: หนึ่งหน้าจอ หนึ่งการ์ด
---

# PRC-07 — บันทึกการรับของ

## Value

ผู้รับของบันทึกการรับของครบหรือบางส่วน โดยไม่เกินจำนวนสั่ง และสถานะใบสั่งซื้อกับใบขอซื้อเปลี่ยนตามจริง

## Scope

- หน้าจอ บันทึกการรับของ (SCR-07) ตามข้อกำหนดหน้าจอ
- จำนวนที่ปฏิเสธไม่นับเป็นรับ
- ปิด PR เมื่อรับครบทุกรายการ
- เรียก API: recordGoodsReceipt (ใช้ร่วม: getPurchaseOrder)

## Acceptance Criteria

<!-- generated:ac -->
| Ref | เกณฑ์ตรวจรับ | ประเภท | ผลที่คาดหวัง |
|---|---|---|---|
| [AC-10-01](../../design/01-requirements/acceptance-criteria/ac-10-01-positive-record-goods-receipt.md) | รับของบางส่วน | Positive | 201 `grNo` ถูกรูปแบบ PO เป็น `PARTIALLY_RECEIVED` |
| [AC-10-02](../../design/01-requirements/acceptance-criteria/ac-10-02-positive-record-goods-receipt.md) | รับของครบด้วยการรับหลายครั้ง | Positive | PO เป็น `RECEIVED` PR เป็น `CLOSED` |
| [AC-10-03](../../design/01-requirements/acceptance-criteria/ac-10-03-boundary-record-goods-receipt.md) | รับของเกินจำนวนสั่ง | Boundary | 422 `ERR-GR-001` |
| [AC-10-04](../../design/01-requirements/acceptance-criteria/ac-10-04-positive-record-goods-receipt.md) | จำนวนที่ปฏิเสธไม่นับเป็นรับ | Positive | ยอดรับสะสมนับ 5 ไม่ใช่ 6 |
<!-- /generated -->

## Dependency / Assumption

- `PRC-06`

- ประมาณการ story point เป็นค่าตั้งต้นที่ AI เสนอ ทีมต้องปรับเทียบ (planning poker) ก่อนใช้วางรอบ

## Out of Scope

- การตรวจรับใบแจ้งหนี้และการจ่ายเงิน

## Source Refs

<!-- generated:refs -->
| Ref | ชนิด | ชื่อ |
|---|---|---|
| [JNY-03](../../design/02-bu-process/journeys/jny-03-order-and-receive.md) | Journey | สั่งซื้อและรับของ |
| [UC-07](../../design/02-bu-process/usecases/uc-07-receive-goods.md) | Use Case | รับของตามใบสั่งซื้อ |
| [FR-10](../../design/01-requirements/functional/fr-10-receive-goods.md) | ข้อกำหนดเชิงหน้าที่ | รับของตามใบสั่งซื้อ |
| [BR-10](../../design/01-requirements/business-rules/br-10-receipt-not-over-order.md) | กฎธุรกิจ | รับของไม่เกินจำนวนสั่ง |
| [SCR-07](../../design/05-ui-desc/screens/scr-07-goods-receipt.md) | หน้าจอ | บันทึกการรับของ |
| [WF-07](../../design/05-ui-desc/wireframes/wf-07-goods-receipt.md) | Wireframe | Wireframe SCR-07 บันทึกการรับของ |
<!-- /generated -->

## Implementation Touchpoints

<!-- generated:touchpoints -->
| operationId | Method Path | การเป็นเจ้าของ |
|---|---|---|
| `recordGoodsReceipt` | POST `/purchase-orders/{poId}/receipts` | เป็นเจ้าของ |
| `getPurchaseOrder` | GET `/purchase-orders/{poId}` | ใช้ร่วม (เจ้าของ PRC-06) |

ตารางข้อมูลที่เกี่ยวข้อง: `goods_receipt`, `gr_item`
<!-- /generated -->

## Change History

| รุ่น | รายละเอียด |
|---|---|
| 1.0 | ร่างแรกจาก design pieces ผ่านการตรวจ gate โดยสคริปต์ รอทีมตรวจรับ |
