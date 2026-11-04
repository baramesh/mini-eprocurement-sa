---
doc_id: AC-09-05
verifies:
- FR-09
kind: Negative
operation: issuePurchaseOrder
scenario: ออก PO ที่เป็น `ISSUED` แล้วด้วยคีย์ใหม่
expected: 409 `ERR-STATE-001`
errors:
- ERR-STATE-001
---

# ออก PO ซ้ำ
