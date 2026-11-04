---
doc_id: AC-01-02
verifies:
- FR-01
kind: Negative
operation: createPurchaseRequest
scenario: '`items` เป็น `[]`'
expected: 422 `ERR-VAL-001`
errors:
- ERR-VAL-001
---

# สร้าง PR ไม่มีรายการ
