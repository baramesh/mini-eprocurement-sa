---
doc_id: AC-08-03
verifies:
- FR-08
kind: Boundary
operation: awardRfq
scenario: '`reason` ยาว 19 ตัวอักษร'
expected: 422 `ERR-RFQ-004`
errors:
- ERR-RFQ-004
---

# เลือกไม่ใช่ต่ำสุด เหตุผล 19 ตัวอักษร
