---
doc_id: AC-03-06
verifies:
- FR-03
kind: Negative
operation: submitPurchaseRequest
scenario: ส่งซ้ำด้วยคีย์ใหม่หลังส่งไปแล้ว
expected: 409 `ERR-STATE-001`
---

# ส่ง PR ที่ไม่ใช่ draft
