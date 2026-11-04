---
doc_id: OPS-createPurchaseOrder
operation: createPurchaseOrder
checks: 'โหมดซื้อตรง: PR `APPROVED`, วงเงินไม่เกิน 5,000, ผู้ขาย `ACTIVE`; โหมดผลประกวด: RFQ `AWARDED` ใช้ราคาจากใบเสนอราคาที่ชนะ; มูลค่าไม่เกินวงเงิน PR (`ERR-PO-001`); PR เป็น `ORDERED`'
success: '`201` สถานะ `DRAFT`'
errors:
- ERR-PO-001
---

# createPurchaseOrder
