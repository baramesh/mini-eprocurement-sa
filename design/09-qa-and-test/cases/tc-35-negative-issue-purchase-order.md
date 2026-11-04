---
doc_id: TC-35
type: Negative
frs:
- FR-09
operation: issuePurchaseOrder
steps: ออก PO ที่เป็น `ISSUED` แล้วด้วยคีย์ใหม่
expected: 409 `ERR-STATE-001`
---

# ออก PO ซ้ำ
