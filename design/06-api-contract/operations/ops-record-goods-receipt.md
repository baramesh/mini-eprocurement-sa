---
doc_id: OPS-recordGoodsReceipt
operation: recordGoodsReceipt
checks: PO สถานะ `ISSUED` หรือ `PARTIALLY_RECEIVED`; รับสะสม ≤ จำนวนสั่งต่อรายการ (`ERR-GR-001`); คำนวณสถานะ PO ใหม่; ถ้ารับครบทุกรายการ PR เป็น `CLOSED`
success: '`201`'
---

# recordGoodsReceipt
