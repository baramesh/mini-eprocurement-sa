---
code: PRC-06
module: PRC
card_type: screen
journey: JNY-03
journey_phase: 1
screen_ref: SCR-06
supports_journeys: []
status: draft
sprint: 3
priority: must
estimate:
  dev: 5
  qa: 3
depends_on:
- PRC-05
- PRC-03
- PRC-08
acceptance_refs:
- AC-09-01
- AC-09-02
- AC-09-03
- AC-09-04
- AC-09-05
- AC-09-06
- AC-09-07
source_refs:
- JNY-03
- UC-06
- FR-09
- BR-01
- BR-09
- BR-11
- SCR-06
- WF-06
owned_touchpoints:
- createPurchaseOrder
- getPurchaseOrder
- issuePurchaseOrder
consumed_touchpoints:
- getPurchaseRequest
- getRfq
- getQuotationComparison
- listVendors
tables:
- po_item
- purchase_order
slicing_reason: หนึ่งหน้าจอ หนึ่งการ์ด
---

# PRC-06 — ใบสั่งซื้อ

## Value

เจ้าหน้าที่ออกใบสั่งซื้อจากผลที่อนุมัติหรือซื้อตรงวงเงินต่ำ และออกใบสั่งซื้อให้ผู้ขาย

## Scope

- หน้าจอ ใบสั่งซื้อ (SCR-06) ตามข้อกำหนดหน้าจอ
- สองโหมด: จากผลประกวดและซื้อตรง
- ตรวจมูลค่าไม่เกินวงเงิน PR
- เรียก API: createPurchaseOrder, getPurchaseOrder, issuePurchaseOrder (ใช้ร่วม: getPurchaseRequest, getQuotationComparison, listVendors)

## Acceptance Criteria

<!-- generated:ac -->
| Ref | เกณฑ์ตรวจรับ | ประเภท | ผลที่คาดหวัง |
|---|---|---|---|
| [AC-09-01](../../design/01-requirements/acceptance-criteria/ac-09-01-boundary-create-purchase-order.md) | ซื้อตรงวงเงิน 5,000.00 | Boundary | 201 `poNo` ถูกรูปแบบ PR เป็น `ORDERED` |
| [AC-09-02](../../design/01-requirements/acceptance-criteria/ac-09-02-boundary-create-purchase-order.md) | ซื้อตรงวงเงิน 5,000.01 | Boundary | 422 `ERR-PO-001` |
| [AC-09-03](../../design/01-requirements/acceptance-criteria/ac-09-03-negative-create-purchase-order.md) | ออก PO ให้ผู้ขายที่ถูกระงับ | Negative | 422 `ERR-VND-002` |
| [AC-09-04](../../design/01-requirements/acceptance-criteria/ac-09-04-positive-issue-purchase-order.md) | ออก PO จาก DRAFT เป็น ISSUED | Positive | 200 `ISSUED` มี audit |
| [AC-09-05](../../design/01-requirements/acceptance-criteria/ac-09-05-negative-issue-purchase-order.md) | ออก PO ซ้ำ | Negative | 409 `ERR-STATE-001` |
| [AC-09-06](../../design/01-requirements/acceptance-criteria/ac-09-06-positive-get-purchase-order.md) | ดู PO พร้อมยอดคงเหลือ | Positive | 200 `qtyReceived` 4 และ `qtyRemaining` 2 (จำนวนที่ปฏิเสธไม่นับเป็นรับ) |
| [AC-09-07](../../design/01-requirements/acceptance-criteria/ac-09-07-negative-get-purchase-order.md) | ดู PO ที่ไม่มี | Negative | 404 `ERR-NF-001` |
<!-- /generated -->

## Dependency / Assumption

- `PRC-05`
- `PRC-03`

- ประมาณการ story point เป็นค่าตั้งต้นที่ AI เสนอ ทีมต้องปรับเทียบ (planning poker) ก่อนใช้วางรอบ

## Out of Scope

- การส่งเอกสารให้ผู้ขายทางอีเมลหรือระบบภายนอก

## Source Refs

<!-- generated:refs -->
| Ref | ชนิด | ชื่อ |
|---|---|---|
| [JNY-03](../../design/02-bu-process/journeys/jny-03-order-and-receive.md) | Journey | สั่งซื้อและรับของ |
| [UC-06](../../design/02-bu-process/usecases/uc-06-issue-po.md) | Use Case | ออกใบสั่งซื้อ |
| [FR-09](../../design/01-requirements/functional/fr-09-issue-po.md) | ข้อกำหนดเชิงหน้าที่ | ออกใบสั่งซื้อ |
| [BR-01](../../design/01-requirements/business-rules/br-01-direct-purchase-limit.md) | กฎธุรกิจ | ซื้อตรงวงเงินต่ำ |
| [BR-09](../../design/01-requirements/business-rules/br-09-po-within-pr-amount.md) | กฎธุรกิจ | PO ไม่เกินวงเงิน PR |
| [BR-11](../../design/01-requirements/business-rules/br-11-suspended-vendor.md) | กฎธุรกิจ | ผู้ขายถูกระงับ |
| [SCR-06](../../design/05-ui-desc/screens/scr-06-po.md) | หน้าจอ | ใบสั่งซื้อ |
| [WF-06](../../design/05-ui-desc/wireframes/wf-06-purchase-order.md) | Wireframe | Wireframe SCR-06 ใบสั่งซื้อ |
<!-- /generated -->

## Implementation Touchpoints

<!-- generated:touchpoints -->
| operationId | Method Path | การเป็นเจ้าของ |
|---|---|---|
| `createPurchaseOrder` | POST `/purchase-orders` | เป็นเจ้าของ |
| `getPurchaseOrder` | GET `/purchase-orders/{poId}` | เป็นเจ้าของ |
| `issuePurchaseOrder` | POST `/purchase-orders/{poId}/issue` | เป็นเจ้าของ |
| `getPurchaseRequest` | GET `/purchase-requests/{prId}` | ใช้ร่วม (เจ้าของ PRC-02) |
| `getRfq` | GET `/rfqs/{rfqId}` | ใช้ร่วม (เจ้าของ PRC-05) |
| `getQuotationComparison` | GET `/rfqs/{rfqId}/comparison` | ใช้ร่วม (เจ้าของ PRC-05) |
| `listVendors` | GET `/vendors` | ใช้ร่วม (เจ้าของ PRC-08) |

ตารางข้อมูลที่เกี่ยวข้อง: `po_item`, `purchase_order`
<!-- /generated -->

## Change History

| รุ่น | รายละเอียด |
|---|---|
| 1.0 | ร่างแรกจาก design pieces ผ่านการตรวจ gate โดยสคริปต์ รอทีมตรวจรับ |
