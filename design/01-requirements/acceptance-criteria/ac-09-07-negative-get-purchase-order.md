---
doc_id: AC-09-07
verifies:
- FR-09
kind: Negative
operation: getPurchaseOrder
scenario: '`poId` ที่ไม่มีในระบบ'
expected: '404 `ERR-NF-001`'
errors:
- ERR-NF-001
---

# ดู PO ที่ไม่มี
