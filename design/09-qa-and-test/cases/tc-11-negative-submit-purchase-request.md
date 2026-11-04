---
doc_id: TC-11
type: Negative
frs:
- FR-03
operation: submitPurchaseRequest
steps: ส่งซ้ำด้วยคีย์ใหม่หลังส่งไปแล้ว
expected: 409 `ERR-STATE-001`
---

# ส่ง PR ที่ไม่ใช่ draft
