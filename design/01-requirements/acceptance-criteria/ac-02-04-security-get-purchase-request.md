---
doc_id: AC-02-04
verifies:
- FR-02
kind: Security
operation: getPurchaseRequest
scenario: ผู้อนุมัติหน่วยงาน A ขอดู PR ของหน่วยงาน B
expected: 404 `ERR-NF-001` (ไม่บอกว่าเอกสารมีอยู่)
errors:
- ERR-NF-001
---

# ดู PR ของหน่วยงานอื่น
