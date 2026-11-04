---
doc_id: AC-09-03
verifies:
- FR-09
- FR-11
kind: Negative
operation: createPurchaseOrder
scenario: ซื้อตรงกับผู้ขาย `SUSPENDED`
expected: 422 `ERR-VND-002`
errors:
- ERR-VND-002
---

# ออก PO ให้ผู้ขายที่ถูกระงับ
