---
doc_id: AC-05-05
verifies:
- FR-05
kind: Negative
operation: createRfq
scenario: PR สถานะ `SUBMITTED`
expected: 409 `ERR-STATE-002`
errors:
- ERR-STATE-002
---

# สร้าง RFQ จาก PR ที่ยังไม่อนุมัติ
