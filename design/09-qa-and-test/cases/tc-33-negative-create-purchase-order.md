---
doc_id: TC-33
type: Negative
frs:
- FR-09
- FR-11
operation: createPurchaseOrder
steps: ซื้อตรงกับผู้ขาย `SUSPENDED`
expected: 422 `ERR-VND-002`
---

# ออก PO ให้ผู้ขายที่ถูกระงับ
