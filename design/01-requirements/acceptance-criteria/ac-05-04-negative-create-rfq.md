---
doc_id: AC-05-04
verifies:
- FR-05
- FR-11
kind: Negative
operation: createRfq
scenario: ผู้ขาย 1 ใน 3 สถานะ `SUSPENDED`
expected: 422 `ERR-VND-002`
---

# เชิญผู้ขายที่ถูกระงับ
