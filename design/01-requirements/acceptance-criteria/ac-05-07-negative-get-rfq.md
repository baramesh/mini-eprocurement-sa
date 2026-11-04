---
doc_id: AC-05-07
verifies:
- FR-05
kind: Negative
operation: getRfq
scenario: '`rfqId` ที่ไม่มีในระบบ'
expected: '404 `ERR-NF-001`'
errors:
- ERR-NF-001
---

# ดู RFQ ที่ไม่มี
