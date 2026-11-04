---
doc_id: AC-02-04
verifies:
- FR-02
kind: Security
operation: getPurchaseRequest
scenario: ผู้อนุมัติหน่วยงาน A ขอดู PR ของหน่วยงาน B
expected: 403 `ERR-AUTH-002`
errors:
- ERR-AUTH-002
---

# ดู PR ของหน่วยงานอื่น
